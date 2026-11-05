"use client";

import { useActionState } from "react";
import { saveSiteSettings, type SettingsFormState } from "../actions";
import { Card, FormNotice, SourceBadge, hintClass, inputClass, labelClass, primaryButton } from "../ui";

const initial: SettingsFormState = {};

export default function SiteForm({
  siteUrl,
  effectiveUrl,
  urlSource,
  linkMinutes,
  requestsPerHour,
  limits,
}: {
  siteUrl: string;
  effectiveUrl: string;
  urlSource: "console" | "environment" | "default" | "none";
  linkMinutes: number;
  requestsPerHour: number;
  limits: { minutes: { min: number; max: number }; perHour: { min: number; max: number } };
}) {
  const [state, action, pending] = useActionState(saveSiteSettings, initial);

  return (
    <Card title="Website address and password-reset rules">
      <form action={action} className="space-y-4">
        <FormNotice state={state} />
        <div>
          <label htmlFor="site-url" className={labelClass}>
            Website address used in e-mails
            <SourceBadge source={urlSource} />
          </label>
          <input
            id="site-url"
            name="siteUrl"
            type="url"
            defaultValue={siteUrl}
            placeholder={effectiveUrl || "https://www.example.com"}
            className={inputClass}
          />
          <p className={hintClass}>
            The start of every link we e-mail, for example https://www.resortinranchi.com. Leave empty to use the server&apos;s own address
            {effectiveUrl && urlSource === "environment" ? ` (${effectiveUrl})` : ""}. Page addresses and SEO are not affected by this.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reset-minutes" className={labelClass}>
              Reset link lasts (minutes)
            </label>
            <input
              id="reset-minutes"
              name="resetLinkMinutes"
              type="number"
              required
              min={limits.minutes.min}
              max={limits.minutes.max}
              defaultValue={linkMinutes}
              className={inputClass}
            />
            <p className={hintClass}>
              {limits.minutes.min} to {limits.minutes.max}. Shorter is safer.
            </p>
          </div>
          <div>
            <label htmlFor="reset-requests" className={labelClass}>
              Reset e-mails per person per hour
            </label>
            <input
              id="reset-requests"
              name="resetRequestsPerHour"
              type="number"
              required
              min={limits.perHour.min}
              max={limits.perHour.max}
              defaultValue={requestsPerHour}
              className={inputClass}
            />
            <p className={hintClass}>
              {limits.perHour.min} to {limits.perHour.max}. Stops the form from flooding an inbox.
            </p>
          </div>
        </div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </Card>
  );
}
