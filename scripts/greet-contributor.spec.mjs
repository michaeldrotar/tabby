import { describe, expect, it, vi } from 'vitest'
import { greetContributor } from './greet-contributor.mjs'

const repo = { owner: 'owner', repo: 'tabby' }
const message =
  'Thank you for your contribution. We will check and reply to you as soon as possible.'
const item = (number, pull, login = 'contributor') => ({
  number,
  user: { login },
  ...(pull ? { pull_request: { url: 'https://api.github.com/pulls/1' } } : {}),
})
const fixture = ({
  pull = false,
  pages = [],
  login = 'contributor',
  action = 'opened',
} = {}) => {
  const context = {
    repo,
    eventName: pull ? 'pull_request_target' : 'issues',
    payload: {
      action,
      sender: { login },
      [pull ? 'pull_request' : 'issue']: item(100, pull, login),
    },
  }
  const github = {
    rest: {
      issues: { listForRepo: vi.fn(), createComment: vi.fn() },
      pulls: { createReview: vi.fn() },
    },
    paginate: {
      iterator: vi.fn(async function* () {
        for (const data of pages) yield { data }
      }),
    },
  }
  return { github, context }
}

describe('contributor greetings', () => {
  it.each([false, true])(
    'greets the first contribution of type PR=%s',
    async (pull) => {
      const input = fixture({
        pull,
        pages: [
          [
            item(100, pull),
            item(101, pull),
            item(1, !pull),
            item(2, pull, 'someone-else'),
          ],
        ],
      })
      expect(await greetContributor(input)).toBe(true)
      expect(input.github.paginate.iterator).toHaveBeenCalledWith(
        input.github.rest.issues.listForRepo,
        { ...repo, creator: 'contributor', state: 'all', per_page: 100 },
      )
      expect(input.github.rest.issues.createComment.mock.calls).toEqual(
        pull ? [] : [[{ ...repo, issue_number: 100, body: message }]],
      )
      expect(input.github.rest.pulls.createReview.mock.calls).toEqual(
        pull
          ? [[{ ...repo, pull_number: 100, body: message, event: 'COMMENT' }]]
          : [],
      )
    },
  )

  it.each([false, true])(
    'does not greet a repeated contribution of type PR=%s on a later page',
    async (pull) => {
      const input = fixture({
        pull,
        pages: [
          Array.from({ length: 100 }, (_, index) => item(index + 101, pull)),
          [item(1, pull)],
        ],
      })
      expect(await greetContributor(input)).toBe(false)
      expect(input.github.rest.issues.createComment).not.toHaveBeenCalled()
      expect(input.github.rest.pulls.createReview).not.toHaveBeenCalled()
    },
  )

  it.each([false, true])(
    'keeps bots eligible for their first contribution of type PR=%s',
    async (pull) => {
      const input = fixture({ pull, login: 'dependabot[bot]', pages: [[]] })
      expect(await greetContributor(input)).toBe(true)
      expect(input.github.paginate.iterator).toHaveBeenCalledWith(
        input.github.rest.issues.listForRepo,
        expect.objectContaining({ creator: 'dependabot[bot]' }),
      )
    },
  )

  it.each(['reopened', 'edited', 'closed', 'synchronize'])(
    'ignores %s events',
    async (action) => {
      const input = fixture({ action })
      expect(await greetContributor(input)).toBe(false)
      expect(input.github.paginate.iterator).not.toHaveBeenCalled()
    },
  )

  it.each(['push', 'pull_request', 'issue_comment'])(
    'ignores unrelated %s events',
    async (eventName) => {
      const input = fixture()
      input.context.eventName = eventName
      expect(await greetContributor(input)).toBe(false)
      expect(input.github.paginate.iterator).not.toHaveBeenCalled()
    },
  )

  it('ignores missing or mismatched contributions', async () => {
    for (const contribution of [undefined, item(100, true)]) {
      const input = fixture()
      input.context.payload.issue = contribution
      expect(await greetContributor(input)).toBe(false)
      expect(input.github.paginate.iterator).not.toHaveBeenCalled()
    }
  })

  it('propagates API failures without sending a greeting', async () => {
    const input = fixture()
    input.github.paginate.iterator.mockImplementation(async function* () {
      throw new Error('API unavailable')
    })
    await expect(greetContributor(input)).rejects.toThrow('API unavailable')
    expect(input.github.rest.issues.createComment).not.toHaveBeenCalled()
    expect(input.github.rest.pulls.createReview).not.toHaveBeenCalled()
  })
})
