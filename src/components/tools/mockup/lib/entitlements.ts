/** UI/export policy. The host passes its already-authorized plan; no billing changes. */
export type StudioPlan = "free" | "pro" | "premium";
let plan: StudioPlan = "premium";
export const setStudioPlan = (value: StudioPlan) => {
  plan = value;
};
export const getStudioPlan = () => plan;
