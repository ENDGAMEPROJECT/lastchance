// Chronological records for the simulated profile. Only tablet-interest signals
// contribute to the lock; the displayed numbers are independent of translation.
export const DATA_REPORT_ENTRIES = [
  { id: 'shoeSearches', time: '16:00', value: 5, relevant: false },
  { id: 'searches', time: '16:02', value: 3, relevant: true },
  { id: 'recipeVideos', time: '16:05', value: 6, relevant: false },
  { id: 'musicFollows', time: '16:08', value: 4, relevant: false },
  { id: 'reviews', time: '16:12', value: 7, relevant: true },
  { id: 'follows', time: '16:15', value: 4, relevant: true },
  { id: 'travelPosts', time: '16:18', value: 3, relevant: false },
  { id: 'saved', time: '16:20', value: 2, relevant: true },
  { id: 'ticketVisits', time: '16:24', value: 2, relevant: false },
  { id: 'visits', time: '16:28', value: 8, relevant: true },
  { id: 'cart', time: '16:32', value: 1, relevant: true },
  { id: 'backpackCart', time: '16:35', value: 1, relevant: false },
]

export const DATA_REPORT_CODE = DATA_REPORT_ENTRIES
  .filter((entry) => entry.relevant)
  .map((entry) => entry.value)
  .join('')
