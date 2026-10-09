"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  description?: string;
};

/** Custom listbox in the top layer: never clipped by editors, sheets or overflow. */
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  disabled = false,
  className = "",
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(
    Math.max(
      0,
      options.findIndex((item) => item.value === value),
    ),
  );
  const search = useRef({ text: "", time: 0 });
  const selected = options.find((item) => item.value === value);

  useEffect(() => {
    const menu = list.current,
      button = trigger.current;
    if (!menu || !button) return;
    if (!open) {
      if (menu.matches(":popover-open")) menu.hidePopover();
      return;
    }
    const reposition = () => {
      const rect = button.getBoundingClientRect();
      const viewport = window.visualViewport;
      const bottom =
        (viewport?.height ?? innerHeight) + (viewport?.offsetTop ?? 0);
      const width = Math.min(Math.max(rect.width, 230), innerWidth - 24);
      const below = bottom - rect.bottom - 12;
      const above = rect.top - (viewport?.offsetTop ?? 0) - 12;
      const upwards = below < 220 && above > below;
      const available = Math.max(100, Math.min(360, upwards ? above : below));
      menu.style.width = `${width}px`;
      menu.style.maxHeight = `${available}px`;
      menu.style.left = `${Math.max(12, Math.min(rect.left, innerWidth - width - 12))}px`;
      menu.style.top = `${upwards ? rect.top - Math.min(menu.scrollHeight, available) - 6 : rect.bottom + 6}px`;
    };
    menu.showPopover();
    reposition();
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !menu.contains(event.target) &&
        !button.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    window.visualViewport?.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      window.visualViewport?.removeEventListener("resize", reposition);
      if (menu.matches(":popover-open")) menu.hidePopover();
    };
  }, [open]);
  useEffect(() => {
    if (open)
      list.current
        ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  };
  const keydown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const initial = Math.max(
        0,
        options.findIndex((item) => item.value === value),
      );
      setActive(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : !open
              ? initial
              : (active +
                  (event.key === "ArrowDown" ? 1 : options.length - 1)) %
                options.length,
      );
      setOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(active);
      else {
        setActive(
          Math.max(
            0,
            options.findIndex((item) => item.value === value),
          ),
        );
        setOpen(true);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === "Tab") setOpen(false);
    else if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const now = Date.now();
      search.current = {
        text:
          now - search.current.time > 700
            ? event.key
            : search.current.text + event.key,
        time: now,
      };
      const found = options.findIndex((option) =>
        option.label
          .toLocaleLowerCase()
          .startsWith(search.current.text.toLocaleLowerCase()),
      );
      if (found >= 0) {
        setActive(found);
        setOpen(true);
      }
    }
  };
  return (
    <div className={`custom-select ${className}`}>
      <button
        ref={trigger}
        type="button"
        className="select-trigger"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        disabled={disabled}
        onKeyDown={keydown}
        onClick={() => {
          setActive(
            Math.max(
              0,
              options.findIndex((item) => item.value === value),
            ),
          );
          setOpen((value) => !value);
        }}
        onBlur={(event) => {
          if (!list.current?.contains(event.relatedTarget)) setOpen(false);
        }}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <div
        ref={list}
        popover="manual"
        id={`${id}-list`}
        role="listbox"
        aria-label={label}
        className="select-popover"
        onPointerDown={(event) => event.preventDefault()}
      >
        <span className="select-menu-label">{label}</span>
        {options.map((option, index) => (
          <div
            key={option.value}
            role="option"
            aria-label={option.label}
            aria-describedby={
              option.description ? `${id}-${index}-description` : undefined
            }
            id={`${id}-${index}`}
            aria-selected={option.value === value}
            data-index={index}
            data-active={index === active}
            onPointerMove={() => setActive(index)}
            onClick={(event) => {
              event.preventDefault();
              choose(index);
            }}
            className="select-option"
          >
            <div>
              <span>{option.label}</span>
              {option.description && (
                <small id={`${id}-${index}-description`}>
                  {option.description}
                </small>
              )}
            </div>
            {value === option.value && <Check size={15} aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}
