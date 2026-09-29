import { z } from "zod";
import { optionalEmail, optionalText, requiredPhone, requiredText } from "./shared";

/** Public "Contact this creator" form — deliberately minimal, mirrors enquirySubmissionSchema's spirit. */
export const influencerEnquirySchema = z.object({
  name: requiredText("Name"),
  phone: requiredPhone,
  email: optionalEmail,
  message: optionalText,
  honeypot: optionalText,
});

export type InfluencerEnquiryInput = z.infer<typeof influencerEnquirySchema>;

export function buildInfluencerEnquiryCreateData(input: InfluencerEnquiryInput, influencerId: string) {
  return {
    influencerId,
    name: input.name,
    phone: input.phone,
    email: input.email,
    message: input.message,
    status: "NEW" as const,
  };
}
