import trendingGreenOffShoulderTop from "../assets/trending_green_off_shoulder_top.png";
import trendingBlackFloralMaxiSkirt from "../assets/trending_black_floral_maxi_skirt.png";
import trendingOliveLongCoat from "../assets/trending_olive_long_coat.png";
import trendingGreenJoggerPants from "../assets/trending_green_jogger_pants.png";
import trendingGreyDrawstringPants from "../assets/trending_grey_drawstring_pants.png";
import trendingSkyBlueButtonTop from "../assets/trending_sky_blue_button_top.png";
import trendingPuffSleeveBlueTop from "../assets/trending_puff_sleeve_blue_top.png";
import trendingBerryZipKnit from "../assets/trending_berry_zip_knit.png";
import trendingMaroonFloralCardigan from "../assets/trending_maroon_floral_cardigan.png";
import trendingTaupeWrapSkirt from "../assets/trending_taupe_wrap_skirt.png";

/** Curated hero images (add files under src/assets/ and switch imports if these paths break). */
const trendingWomenFestiveSet =
  "/@fs/C:/Users/Dell/.cursor/projects/c-Users-Dell-OneDrive-Desktop-FYP-FYPCoursework/assets/c__Users_Dell_AppData_Roaming_Cursor_User_workspaceStorage_bf94fda10fbadcb9b9c2020957bfa737_images_image-e7d1bd40-e819-415f-9dc9-df9cec8710fd.png";
const trendingMenClassicDaura =
  "/@fs/C:/Users/Dell/.cursor/projects/c-Users-Dell-OneDrive-Desktop-FYP-FYPCoursework/assets/c__Users_Dell_AppData_Roaming_Cursor_User_workspaceStorage_bf94fda10fbadcb9b9c2020957bfa737_images_image-4fb4fe9f-d914-4352-b61a-2e9ea608695e.png";
const trendingBridalGoldenLehenga =
  "/@fs/C:/Users/Dell/.cursor/projects/c-Users-Dell-OneDrive-Desktop-FYP-FYPCoursework/assets/c__Users_Dell_AppData_Roaming_Cursor_User_workspaceStorage_bf94fda10fbadcb9b9c2020957bfa737_images_image-94ff44b2-3ee6-4a8c-bb1c-df8cb2932e16.png";

const bySlug = new Map();

function reg(entry) {
  bySlug.set(entry.showcaseSlug, entry);
  return entry;
}

/** Shown on home + product detail; `catalogSlug` powers cart / customize when the look is not a separate SKU. */
export const trendingShowcaseBase = [
  reg({
    showcaseSlug: "festive-beige-set",
    img: trendingWomenFestiveSet,
    alt: "Women's Festive Beige Set",
    title: "Festive Beige Set",
    price: 12499,
    typeLabel: "Trending",
    description:
      "Embroidered festive beige co-ord with dupatta-inspired drape and tailored waist—ideal for celebrations and family gatherings.",
    catalogSlug: "pastel-colorblock-button-down-shirt",
  }),
  reg({
    showcaseSlug: "classic-daura-set",
    img: trendingMenClassicDaura,
    alt: "Men's Classic Daura Set",
    title: "Classic Daura Set",
    price: 3699,
    typeLabel: "Trending",
    description:
      "Traditional Nepali daura silhouette in a classic cut with refined tailoring and breathable cotton blend for everyday wear.",
    catalogSlug: "white-oxford-dress-shirt",
  }),
  reg({
    showcaseSlug: "green-off-shoulder-top",
    img: trendingGreenOffShoulderTop,
    alt: "Green Off Shoulder Top",
    title: "Green Off-Shoulder Top",
    price: 2199,
    typeLabel: "Trending",
    description:
      "Fresh green off-shoulder top with a soft stretch fit—pairs with denim, skirts, or layered under jackets.",
    catalogSlug: "blue-sleeveless-ribbed-crop-top",
  }),
  reg({
    showcaseSlug: "floral-maxi-skirt",
    img: trendingBlackFloralMaxiSkirt,
    alt: "Black Floral Maxi Skirt",
    title: "Floral Maxi Skirt",
    price: 2899,
    typeLabel: "Trending",
    description:
      "Floor-length floral maxi with a flattering high waist and fluid drape for brunches, evenings, and travel.",
    catalogSlug: "brown-high-waist-pleated-maxi-skirt",
  }),
];

export const trendingShowcaseMore = [
  reg({
    showcaseSlug: "olive-long-coat",
    img: trendingOliveLongCoat,
    alt: "Olive Long Coat",
    title: "Olive Long Coat",
    price: 6499,
    typeLabel: "Trending",
    description:
      "Statement olive long coat with clean lines and a structured collar—layer over knits or tailored separates.",
    catalogSlug: "long-grey-puffer-parka",
  }),
  reg({
    showcaseSlug: "green-jogger-pants",
    img: trendingGreenJoggerPants,
    alt: "Green Jogger Pants",
    title: "Green Jogger Pants",
    price: 2399,
    typeLabel: "Trending",
    description:
      "Tapered joggers in a deep green wash with drawstring waist and ankle-friendly cuffs for relaxed days.",
    catalogSlug: "slim-fit-cream-joggers",
  }),
  reg({
    showcaseSlug: "bridal-golden-lehenga",
    img: trendingBridalGoldenLehenga,
    alt: "Bridal Golden Lehenga",
    title: "Bridal Golden Lehenga",
    price: 18999,
    typeLabel: "Trending",
    description:
      "Bridal golden lehenga with ornate embroidery and a voluminous skirt—made for your big day and receptions.",
    catalogSlug: "white-tiered-maxi-skirt",
  }),
  reg({
    showcaseSlug: "grey-drawstring-pants",
    img: trendingGreyDrawstringPants,
    alt: "Grey Drawstring Pants",
    title: "Grey Drawstring Pants",
    price: 2599,
    typeLabel: "Trending",
    description:
      "Soft grey drawstring pants with a relaxed leg and easy pull-on comfort for home, studio, or travel.",
    catalogSlug: "charcoal-wide-leg-denim-jeans",
  }),
  reg({
    showcaseSlug: "sky-blue-button-top",
    img: trendingSkyBlueButtonTop,
    alt: "Sky Blue Button Top",
    title: "Sky Blue Button Top",
    price: 2299,
    typeLabel: "Trending",
    description:
      "Sky blue button-through top with a neat collar and lightweight fabric for warm-weather layering.",
    catalogSlug: "sky-blue-check-long-sleeve-shirt",
  }),
  reg({
    showcaseSlug: "puff-sleeve-blue-top",
    img: trendingPuffSleeveBlueTop,
    alt: "Blue Puff Sleeve Top",
    title: "Blue Puff Sleeve Top",
    price: 2499,
    typeLabel: "Trending",
    description:
      "Statement puff sleeves in a rich blue with a fitted bodice—dress up with skirts or down with jeans.",
    catalogSlug: "textured-blue-gauze-button-down",
  }),
  reg({
    showcaseSlug: "berry-zip-knit-top",
    img: trendingBerryZipKnit,
    alt: "Berry Zip Knit Top",
    title: "Berry Zip Knit Top",
    price: 2799,
    typeLabel: "Trending",
    description:
      "Berry-toned zip knit with a high collar and soft texture—perfect between-season layering.",
    catalogSlug: "mint-quarter-zip-hoodie",
  }),
  reg({
    showcaseSlug: "maroon-floral-cardigan",
    img: trendingMaroonFloralCardigan,
    alt: "Maroon Floral Cardigan",
    title: "Maroon Floral Cardigan",
    price: 3199,
    typeLabel: "Trending",
    description:
      "Maroon floral cardigan with button front and cozy weight—throws on over tees and dresses alike.",
    catalogSlug: "oversized-lavender-longline-shirt",
  }),
  reg({
    showcaseSlug: "taupe-wrap-skirt",
    img: trendingTaupeWrapSkirt,
    alt: "Taupe Wrap Skirt",
    title: "Taupe Wrap Skirt",
    price: 2699,
    typeLabel: "Trending",
    description:
      "Taupe wrap skirt with a secure tie and midi length—office-ready with boots or sandals.",
    catalogSlug: "high-waist-denim-pencil-skirt",
  }),
];

export function getTrendingShowcase(slugOrId) {
  const key = String(slugOrId || "").trim();
  if (!key || /^\d+$/.test(key)) return null;
  return bySlug.get(key) || null;
}

/**
 * Hero-style primary hex per showcase (catalog SKU may differ from the look on the card).
 * Used on Customize when the user selects the related catalog base for that trending entry.
 */
const SHOWCASE_PRIMARY_HEX = {
  "festive-beige-set": "#e6ddcf",
  "classic-daura-set": "#f4f1ea",
  "green-off-shoulder-top": "#355040",
  "floral-maxi-skirt": "#181818",
  "olive-long-coat": "#4a5438",
  "green-jogger-pants": "#2f4d38",
  "bridal-golden-lehenga": "#c9a227",
  "grey-drawstring-pants": "#8e9298",
  "sky-blue-button-top": "#7eb6eb",
  "puff-sleeve-blue-top": "#3d6aa8",
  "berry-zip-knit-top": "#8b2f5c",
  "maroon-floral-cardigan": "#6b2435",
  "taupe-wrap-skirt": "#a89884",
};

/**
 * @param {{ showcaseSlug?: string } | null} showcaseEntry
 * @param {{ product_type?: string } | null} catalogProduct
 * @returns {Record<string, string>}
 */
export function getTrendingPartColorOverrides(showcaseEntry, catalogProduct) {
  if (!showcaseEntry?.showcaseSlug || !catalogProduct) return {};
  const primary = SHOWCASE_PRIMARY_HEX[showcaseEntry.showcaseSlug];
  if (!primary) return {};
  const type = String(catalogProduct.product_type || "").toLowerCase();
  if (type === "pant") return { front: primary, back: primary };
  if (type === "skirt") return { front: primary, back: primary, side: primary };
  if (type === "hoodie" || type === "jacket") return { body: primary, sleeves: primary };
  if (type === "tshirt") return { body: primary };
  return { body: primary, sleeves: primary, collar: primary };
}
