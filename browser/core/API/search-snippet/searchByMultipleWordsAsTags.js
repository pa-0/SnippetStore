import searchSnippet from '.'

export function searchByMultipleWordsAsTags (searchQuery) {
  let finalSearchResult = []
  searchQuery.split(' ').forEach((word) => {
    finalSearchResult = [
      ...finalSearchResult,
      ...searchSnippet(this.rawSnippets, `#${word}`)
    ]
  })
  return finalSearchResult
}
