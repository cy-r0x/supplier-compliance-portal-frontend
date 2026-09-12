"use client";

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import {
  CheckIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import type { ApiTemplateListItem } from "@/lib/api/templates-api";

type TemplateSelectProps = {
  id?: string;
  value: string;
  templates: ApiTemplateListItem[];
  disabled?: boolean;
  invalid?: boolean;
  onChange: (templateId: string) => void;
  onCreateNew: () => void;
};

export function TemplateSelect({
  id = "requirement-template",
  value,
  templates,
  disabled = false,
  invalid = false,
  onChange,
  onCreateNew,
}: TemplateSelectProps) {
  const selected = templates.find((tpl) => tpl.id === value) ?? null;
  const [menuKey, setMenuKey] = useState(0);

  return (
    <Listbox
      key={menuKey}
      value={value || null}
      disabled={disabled}
      onChange={(next) => {
        if (typeof next === "string" && next) onChange(next);
      }}
    >
      <div className="relative mt-1.5">
        <ListboxButton
          id={id}
          aria-invalid={invalid || undefined}
          className={`group flex h-11 w-full items-center gap-2.5 rounded-[9px] border bg-bg-elevated px-3 text-left text-[13px] outline-none transition-[border-color,box-shadow,background-color] duration-150 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            invalid
              ? "border-danger-500 focus-visible:border-danger-500 focus-visible:ring-danger-500/20"
              : "border-border-subtle focus-visible:border-focus-ring focus-visible:ring-focus-ring/25"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] ${
              selected
                ? "bg-brand-100 text-brand-700"
                : "bg-bg-app text-text-muted"
            }`}
            aria-hidden="true"
          >
            <DocumentTextIcon className="h-4 w-4" />
          </span>
          <span
            className={`min-w-0 flex-1 truncate ${
              selected ? "font-medium text-text-primary" : "text-text-muted"
            }`}
          >
            {selected?.name ?? "Select a template"}
          </span>
          <ChevronDownIcon
            className="h-4 w-4 shrink-0 text-text-muted transition-transform duration-150 group-data-open:rotate-180"
            aria-hidden="true"
          />
        </ListboxButton>

        <ListboxOptions
          transition
          anchor="bottom start"
          className="z-50 mt-1.5 w-[var(--button-width)] origin-top overflow-hidden rounded-[12px] border border-border-subtle bg-bg-elevated shadow-[0_12px_32px_rgba(15,23,42,0.12)] outline-none transition duration-150 ease-out data-closed:scale-95 data-closed:opacity-0 [--anchor-gap:6px]"
        >
          <div className="border-b border-border-subtle px-3 py-2">
            <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
              Your templates
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto p-1.5">
            {templates.length === 0 ? (
              <p className="px-2.5 py-3 text-[12px] text-text-secondary">
                No templates yet. Create one to lock requirements for this
                request.
              </p>
            ) : (
              templates.map((tpl) => (
                <ListboxOption
                  key={tpl.id}
                  value={tpl.id}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] text-text-primary outline-none transition-colors duration-100 data-focus:bg-brand-100/70 data-selected:bg-brand-100 data-selected:text-brand-700"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-bg-app text-text-muted group-data-selected:bg-bg-elevated group-data-selected:text-brand-700"
                    aria-hidden="true"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {tpl.name}
                  </span>
                  <CheckIcon
                    className="h-4 w-4 shrink-0 text-brand-600 opacity-0 group-data-selected:opacity-100"
                    aria-hidden="true"
                  />
                </ListboxOption>
              ))
            )}
          </div>

          <div className="border-t border-border-subtle p-1.5">
            <button
              type="button"
              onClick={() => {
                setMenuKey((key) => key + 1);
                onCreateNew();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium text-brand-700 outline-none transition-colors duration-100 hover:bg-brand-100 focus-visible:bg-brand-100 focus-visible:ring-2 focus-visible:ring-focus-ring/30"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-brand-100 text-brand-700"
                aria-hidden="true"
              >
                <PlusIcon className="h-4 w-4" />
              </span>
              Create new template…
            </button>
          </div>
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
