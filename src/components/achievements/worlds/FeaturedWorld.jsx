import AzureWorld from "./AzureWorld";
import ApexWorld from "./ApexWorld";
import SecurityWorld from "./SecurityWorld";

/* Featured-tile worlds by credential id (data/achievements.js). A featured
   credential without one simply plays none; the scenes use palette roles,
   so any of them works on any tile tone. */
const SCENES = {
  "microsoft-certified-azure-fundamentals": AzureWorld,
  "oracle-apex-cloud-certified-developer-professional": ApexWorld,
  "github-advanced-security": SecurityWorld,
};

export default function FeaturedWorld({ id, reduce }) {
  const Scene = SCENES[id];
  return Scene ? <Scene reduce={reduce} /> : null;
}
