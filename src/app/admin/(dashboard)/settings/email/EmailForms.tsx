"use client";

import { useActionState } from "react";
import { clearMailSettings, saveMailSettings, sendTestEmail, type SettingsFormState } from "../actions";
import { Card, FormNotice, SourceBadge, dangerButton, hintClass, inputClass, labelClass, primaryButton, secondaryButton } from "../ui";

type Source = "console" | "environment" | "default" | "none";
const initial: SettingsFormState = {};

export default function EmailForms({
  user,
  fromName,
  hasPassword,
  passwordSource,
  userSource,
  fromNameSource,
  unreadable,
  encryptionReady,
  adminEmail,
}: {
  user: string;
  fromName: string;
  hasPassword: boolean;
  passwordSource: Source;
  userSource: Source;
  fromNameSource: Source;
  unreadable: boolean;
  encryptionReady: boolean;
  adminEmail: string;
}) {
  const [saveState, saveAction, saving] = useActionState(saveMailSettings, initial);
  const [testState, testAction, testing] = useActionState(sendTestEmail, initial);
  const [clearState, clearAction, clearing] = useActionState(clearMailSettings, initial);

  return (
    <>
      <Card title="Gmail account for sending e-mail" description="Used for password-reset links. A value saved here wins over the server's own settings.">
        {!encryptionReady && (
          <div role="note" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">One-time server step before the app password can be saved here</p>
            <p className="mt-1">
              Add a line <code className="rounded bg-white px-1">SETTINGS_ENCRYPTION_KEY=...</code> to the server settings (the same place as
              DATABASE_URL), then restart. Make a key with:
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-white p-2 text-xs">node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</pre>
            <p className="mt-2">Keep a private copy of the key. If it is lost, the saved app password must simply be typed in again.</p>
          </div>
        )}
        {unreadable && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            A saved app password exists but cannot be read (the encryption key was changed or removed). Type the app password again to replace it.
          </p>
        )}
        <form action={saveAction} className="space-y-4">
          <FormNotice state={saveState} />
          <div>
            <label htmlFor="mail-user" className={labelClass}>
              Gmail address
              <SourceBadge source={userSource} />
            </label>
            <input id="mail-user" name="user" type="email" required defaultValue={user} autoComplete="off" className={inputClass} />
          </div>
          <div>
            <label htmlFor="mail-pass" className={labelClass}>
              App password
              <SourceBadge source={passwordSource} />
            </label>
            <input
              id="mail-pass"
              name="appPassword"
              type="password"
              autoComplete="new-password"
              placeholder={hasPassword ? "•••• •••• •••• ••••  (saved: leave empty to keep it)" : "abcd efgh ijkl mnop"}
              disabled={!encryptionReady}
              className={inputClass}
            />
            <p className={hintClass}>The 16-letter code from Google, not the normal Gmail password. It is never shown again after saving.</p>
          </div>
          <div>
            <label htmlFor="mail-from" className={labelClass}>
              Sender name people see
              <SourceBadge source={fromNameSource} />
            </label>
            <input id="mail-from" name="fromName" type="text" required maxLength={80} defaultValue={fromName} className={inputClass} />
          </div>
          <button type="submit" disabled={saving || (!encryptionReady && !hasPassword)} className={primaryButton}>
            {saving ? "Saving…" : "Save e-mail settings"}
          </button>
        </form>
      </Card>

      <Card title="Check that it works" description={`Sends a short test e-mail to your own address (${adminEmail}).`}>
        <form action={testAction} className="space-y-3">
          <FormNotice state={testState} />
          <button type="submit" disabled={testing} className={secondaryButton}>
            {testing ? "Sending…" : "Send a test e-mail"}
          </button>
        </form>
      </Card>

      <Card title="Stop using the saved account" description="Removes the Gmail address, app password and sender name saved here. If the server has its own e-mail settings, those apply again.">
        <form
          action={clearAction}
          onSubmit={(e) => {
            if (!window.confirm("Remove the saved e-mail account from Settings?")) e.preventDefault();
          }}
          className="space-y-3"
        >
          <FormNotice state={clearState} />
          <button type="submit" disabled={clearing} className={dangerButton}>
            {clearing ? "Removing…" : "Remove saved account"}
          </button>
        </form>
      </Card>
    </>
  );
}
