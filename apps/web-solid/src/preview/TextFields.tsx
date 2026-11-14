import { Button, Icon, SearchField, Text, TextField } from "@acme/ui-solid";
import { createSignal } from "solid-js";

export function TextFieldsSection() {
  const [value, setValue] = createSignal("");
  const [query, setQuery] = createSignal("");
  const [secret, setSecret] = createSignal("correct horse");
  const [revealed, setRevealed] = createSignal(false);
  const [notes, setNotes] = createSignal(
    "Ship the weekly report on Monday.\nAsk Grace about the numbers for March.\nBook the room.\nSend the agenda.",
  );
  const [bio, setBio] = createSignal("Writes programs for machines that do not exist yet.");
  const [search, setSearch] = createSignal("");
  const [submitted, setSubmitted] = createSignal("");
  return (
    <>
      <div class="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Email"
          placeholder="name@example.com"
          description="We send the sign-in code to this address."
          value={value()}
          onChange={setValue}
        />
        <TextField label="Project name" value="Weekly report" onChange={() => {}} required />
        <TextField
          label="Sign-in code"
          value="12345"
          onChange={() => {}}
          error="That code is wrong or has expired."
        />
        <TextField label="Organization" value="Acme Inc." onChange={() => {}} disabled />
        <TextField
          label="Search"
          placeholder="Projects, people, files"
          leading={<Icon name="search" size="sm" />}
          value={query()}
          onChange={setQuery}
        />
        <TextField
          label="Weight"
          inputMode="decimal"
          value="72.5"
          onChange={() => {}}
          trailing={
            <Text variant="detail" tone="inherit" as="span">
              kg
            </Text>
          }
        />
        <TextField
          label="Password"
          type={revealed() ? "text" : "password"}
          leading={<Icon name="lock" size="sm" />}
          trailing={
            <Button
              variant="ghost"
              size="sm"
              iconStart={revealed() ? "eye-off" : "eye"}
              aria-label={revealed() ? "Hide the password" : "Show the password"}
              onPress={() => setRevealed(!revealed())}
            />
          }
          value={secret()}
          onChange={setSecret}
        />
        <TextField
          label="Promo code"
          leading={<Icon name="tag" size="sm" />}
          value="SPRING"
          onChange={() => {}}
          error="That code has expired."
        />
        <TextField label="Notes" multiline value={notes()} onChange={setNotes} />
        <TextField
          label="Bio"
          description="Shown on your profile."
          multiline
          maxLength={80}
          value={bio()}
          onChange={setBio}
        />
        <TextField
          label="Message"
          placeholder="Write a reply"
          multiline
          rows={2}
          leading={<Icon name="message-square" size="sm" />}
          value=""
          onChange={() => {}}
        />
        <TextField
          label="Display name"
          maxLength={12}
          value="Ada Lovelace"
          onChange={() => {}}
          error="Use 12 characters or fewer, without spaces."
        />
      </div>
      <div class="grid gap-4 sm:grid-cols-2">
        <SearchField
          label="Search projects"
          placeholder="Search projects"
          value={search()}
          onChange={setSearch}
          onSubmit={setSubmitted}
        />
        <SearchField label="Search people" value="Ada Lovelace" onChange={() => {}} />
        <SearchField
          label="Search files"
          placeholder="Unavailable offline"
          value=""
          onChange={() => {}}
          disabled
        />
        <Text variant="detail" tone="secondary" as="span" class="self-center">
          {submitted() ? `Searched for “${submitted()}”.` : "Enter searches, Escape clears."}
        </Text>
      </div>
    </>
  );
}
