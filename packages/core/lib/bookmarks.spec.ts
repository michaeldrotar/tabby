import { describe, expect, it } from 'vitest'
import {
  bookmarkSelectionRoots,
  bookmarkStructurePlan,
  bookmarkWindowContents,
  decodeBookmarkGroup,
  directBookmarkSelection,
  encodeBookmarkGroup,
  flattenBookmarks,
  restoreBookmarkPlan,
} from './bookmarks.js'
import type { BookmarkNode, BookmarkWriteNode } from './bookmarks.js'

const link = (id: string): BookmarkNode => ({
  id,
  title: id,
  url: `https://example.com/${id}`,
})
const toNode = (node: BookmarkWriteNode, id: string): BookmarkNode => ({
  ...node,
  id,
  children: node.children?.map((child, index) =>
    toNode(child, `${id}-${index}`),
  ),
})
const folder = (id: string, children: BookmarkNode[]): BookmarkNode => ({
  id,
  title: id,
  children,
})

describe('bookmark window format', () => {
  it('maps direct bookmarks and child branches to ordered windows, flattening deeper levels into groups', () => {
    const tree = folder('root', [
      link('a'),
      folder('empty', [folder('also-empty', [])]),
      folder('work', [
        link('b'),
        folder('project', [link('c'), folder('deep', [link('d')])]),
        link('e'),
      ]),
      folder('reading', [folder('articles', [link('f')])]),
      link('g'),
    ])
    expect(bookmarkStructurePlan(tree)).toEqual([
      { tabs: [{ url: link('a').url }, { url: link('g').url }], groups: [] },
      {
        tabs: [
          { url: link('b').url },
          { url: link('c').url, group: 'project' },
          { url: link('d').url, group: 'project' },
          { url: link('e').url },
        ],
        groups: [{ id: 'project', title: 'project', color: 'grey' }],
      },
      {
        tabs: [{ url: link('f').url, group: 'articles' }],
        groups: [{ id: 'articles', title: 'articles', color: 'grey' }],
      },
    ])
  })

  it('round-trips tab order, titles, duplicate group names, empty labels, colors, and escaped characters', () => {
    const groups = [
      { id: 1, windowId: 1, title: 'Work / % [] 🐈', color: 'cyan' as const },
      { id: 2, windowId: 1, title: 'Work / % [] 🐈', color: 'orange' as const },
      { id: 3, windowId: 1, title: '', color: 'purple' as const },
    ]
    const tabs = [undefined, 1, 1, undefined, 2, 3].map((groupId, index) => ({
      id: index,
      index,
      windowId: 1,
      groupId,
      title: `Title ${index}`,
      url: `https://example.com/${index}`,
    }))
    const saved = bookmarkWindowContents([...tabs].reverse(), groups)
    expect(saved.skipped).toBe(0)
    const restore = restoreBookmarkPlan(
      folder(
        'saved',
        saved.children.map((node, index) => toNode(node, String(index))),
      ),
    )
    expect(restore.tabs.map((tab) => tab.url)).toEqual(
      tabs.map((tab) => tab.url),
    )
    expect(restore.tabs.map((tab) => tab.group)).toEqual([
      undefined,
      '1',
      '1',
      undefined,
      '3',
      '4',
    ])
    expect(
      restore.groups.map(({ title, color }) => ({ title, color })),
    ).toEqual(groups.map(({ title, color }) => ({ title, color })))
    expect(saved.children[1]?.children?.map((node) => node.title)).toEqual([
      'Title 1',
      'Title 2',
    ])
    expect(
      decodeBookmarkGroup(
        encodeBookmarkGroup({ id: 'x', title: '', color: 'green' }),
      ),
    ).toEqual({ id: 'x', title: '', color: 'green' })
  })

  it('skips unsupported and missing URLs and treats malformed metadata as a normal folder title', () => {
    const saved = bookmarkWindowContents(
      [
        {
          id: 1,
          windowId: 1,
          index: 0,
          title: 'Script',
          url: 'javascript:alert(1)',
        },
        { id: 2, windowId: 1, index: 1, title: 'Missing' },
        {
          id: 3,
          windowId: 1,
          index: 2,
          title: 'Browser',
          url: 'chrome://settings',
        },
      ],
      [],
    )
    expect(saved).toEqual({
      skipped: 2,
      children: [{ title: 'Browser', url: 'chrome://settings' }],
    })
    expect(
      decodeBookmarkGroup(
        encodeBookmarkGroup({ id: 'x', title: 'Work', color: 'green' }).replace(
          /^Work /,
          'Renamed ',
        ),
      )?.title,
    ).toBe('Renamed')
    expect(decodeBookmarkGroup('Work [Tabby group v1:%bad]')).toBeUndefined()
    expect(
      decodeBookmarkGroup(
        `Work [Tabby group v1:${encodeURIComponent(JSON.stringify(['id', 'Work', 'invalid']))}]`,
      ),
    ).toBeUndefined()
  })
})

describe('bookmark selections', () => {
  it('applies destructive operations once to nested selections and opens only direct children in order', () => {
    const tree = folder('root', [
      folder('parent', [link('a'), folder('nested', [link('b')]), link('c')]),
    ])
    const nodes = flattenBookmarks([tree])
    const parent = nodes.find((node) => node.id === 'parent')!
    parent.children!.forEach((node) => {
      node.parentId = parent.id
    })
    const nested = nodes.find((node) => node.id === 'nested')!
    nested.children!.forEach((node) => {
      node.parentId = nested.id
    })
    expect(
      bookmarkSelectionRoots(nodes, ['parent', 'a', 'b']).map(
        (node) => node.id,
      ),
    ).toEqual(['parent'])
    expect(
      directBookmarkSelection([parent, link('a'), link('b')]).map(
        (node) => node.id,
      ),
    ).toEqual(['a', 'c', 'b'])
  })
})
