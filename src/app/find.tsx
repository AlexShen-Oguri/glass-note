import {Redirect} from 'expo-router';

// Keep old bookmarks usable after folding search back into the catalogue.
export default function LegacyFindRoute() {
  return <Redirect href="/discover" />;
}
