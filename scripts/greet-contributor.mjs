const message =
  'Thank you for your contribution. We will check and reply to you as soon as possible.'

export const greetContributor = async ({ github, context }) => {
  const { eventName, payload, repo } = context
  const isPull = eventName === 'pull_request_target'
  if (payload.action !== 'opened' || (!isPull && eventName !== 'issues')) {
    return false
  }
  const contribution = isPull ? payload.pull_request : payload.issue
  if (!contribution || (!isPull && contribution.pull_request)) return false

  const author = contribution.user.login
  for await (const { data } of github.paginate.iterator(
    github.rest.issues.listForRepo,
    { ...repo, creator: author, state: 'all', per_page: 100 },
  )) {
    if (
      data.some(
        (item) =>
          item.user?.login === author &&
          item.number < contribution.number &&
          Boolean(item.pull_request) === isPull,
      )
    ) {
      return false
    }
  }

  if (isPull) {
    await github.rest.pulls.createReview({
      ...repo,
      pull_number: contribution.number,
      body: message,
      event: 'COMMENT',
    })
  } else {
    await github.rest.issues.createComment({
      ...repo,
      issue_number: contribution.number,
      body: message,
    })
  }
  return true
}
