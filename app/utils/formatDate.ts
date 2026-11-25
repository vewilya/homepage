export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

export const yearOf = (value: string) => new Date(value).getFullYear();
