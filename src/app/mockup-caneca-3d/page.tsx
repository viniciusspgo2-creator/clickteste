import { permanentRedirect } from "next/navigation";

/** The former product landing page is replaced by the current home. */
export default function LegacyStudioLanding() {
  permanentRedirect("/");
}
