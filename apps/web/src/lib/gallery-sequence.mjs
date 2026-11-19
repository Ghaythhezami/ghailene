/**
 * @param {string[]} slugs
 * @param {string} current
 * @param {Set<string>} emptyCategories
 * @param {boolean} empty
 * @returns {string | null}
 */
export function nextStoryCategory(slugs, current, emptyCategories, empty) {
  const sequence = [
    ...slugs.filter((slug) => slug === "remote"),
    ...slugs.filter((slug) => slug !== "remote" && slug !== "__all__"),
  ];
  if (!sequence.length) return null;
  if (empty && current) emptyCategories.add(current);
  else emptyCategories.clear();
  if (emptyCategories.size >= sequence.length) return null;
  return sequence[(sequence.indexOf(current) + 1) % sequence.length];
}
