"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, X } from "lucide-react";

interface Option {
  id: string;
  keyCode: string;
  stringValue: string;
}

interface ClassificationComboboxProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  onCreateNew: (keyCode: string, stringValue: string) => void;
  placeholder?: string;
  multiple?: boolean;
  required?: boolean;
}

export function ClassificationCombobox({
  label,
  value,
  options,
  onChange,
  onCreateNew,
  placeholder = "Select or type to create...",
  multiple = false,
  required = false,
}: ClassificationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingCreates, setPendingCreates] = useState<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedValues = value ? value.split(",").filter(Boolean) : [];

  function getDisplayName(keyCode: string): string {
    const pending = pendingCreates.get(keyCode);
    if (pending) return pending;
    const option = options.find((o) => o.keyCode === keyCode);
    return option?.stringValue || keyCode;
  }

  const filteredOptions = options.filter(
    (o) =>
      (o.keyCode.toLowerCase().includes(search.toLowerCase()) ||
        o.stringValue.toLowerCase().includes(search.toLowerCase())) &&
      !selectedValues.includes(o.keyCode)
  );

  const exactMatch = options.some(
    (o) =>
      o.keyCode.toLowerCase() === search.toLowerCase() ||
      o.stringValue.toLowerCase() === search.toLowerCase()
  );

  const searchMatchesSelected = selectedValues.some(
    (v) => v.toLowerCase() === search.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(option: Option) {
    if (multiple) {
      const newValues = [...selectedValues, option.keyCode];
      onChange(newValues.join(","));
    } else {
      onChange(option.keyCode);
      setIsOpen(false);
    }
    setSearch("");
    inputRef.current?.focus();
  }

  function handleCreate() {
    if (!search.trim()) return;
    const keyCode = search
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    const stringValue = search.trim();

    if (selectedValues.includes(keyCode)) {
      setSearch("");
      return;
    }

    setPendingCreates((prev) => new Map(prev).set(keyCode, stringValue));
    onCreateNew(keyCode, stringValue);

    if (multiple) {
      const newValues = [...selectedValues, keyCode];
      onChange(newValues.join(","));
    } else {
      onChange(keyCode);
      setIsOpen(false);
    }
    setSearch("");
    inputRef.current?.focus();
  }

  function handleRemove(keyCode: string) {
    const newValues = selectedValues.filter((v) => v !== keyCode);
    onChange(newValues.join(","));
  }

  function handleClear() {
    onChange("");
    setPendingCreates(new Map());
    setSearch("");
    setIsOpen(false);
  }

  if (!multiple) {
    const displayValue = value ? getDisplayName(value) : "";
    
    return (
      <div ref={containerRef} className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`flex items-center border rounded-lg bg-white cursor-pointer ${
            isOpen ? "ring-1 ring-gray-900 border-gray-900" : "border-gray-200"
          }`}
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none"
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredOptions.length > 0 && !search.trim()) {
                    handleSelect(filteredOptions[0]);
                  } else if (search.trim() && !exactMatch) {
                    handleCreate();
                  } else if (filteredOptions.length > 0) {
                    handleSelect(filteredOptions[0]);
                  }
                }
                if (e.key === "Escape") {
                  setIsOpen(false);
                  setSearch("");
                }
              }}
            />
          ) : (
            <span className={`flex-1 px-3 py-2 text-sm ${displayValue ? "text-gray-900" : "text-gray-400"}`}>
              {displayValue || placeholder}
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
        </div>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100"
              >
                Clear selection
              </button>
            )}

            {filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                <span className="font-medium">{option.keyCode}</span>
                {option.stringValue !== option.keyCode && (
                  <span className="text-gray-500 ml-2">{option.stringValue}</span>
                )}
              </button>
            ))}

            {search.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900 border-t border-gray-100"
              >
                <Plus className="h-4 w-4" />
                Create "{search.trim()}"
              </button>
            )}

            {filteredOptions.length === 0 && !search.trim() && (
              <div className="px-3 py-2 text-sm text-gray-500">No options available. Type to create one.</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedValues.map((keyCode) => (
            <span
              key={keyCode}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
            >
              {getDisplayName(keyCode)}
              <button
                type="button"
                onClick={() => handleRemove(keyCode)}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className={`flex items-center border rounded-lg bg-white cursor-pointer ${
          isOpen ? "ring-1 ring-gray-900 border-gray-900" : "border-gray-200"
        }`}
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-lg focus:outline-none"
          placeholder={selectedValues.length > 0 ? "Add another..." : placeholder}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (search.trim() && !exactMatch && !searchMatchesSelected) {
                handleCreate();
              } else if (filteredOptions.length > 0) {
                handleSelect(filteredOptions[0]);
              }
            }
            if (e.key === "Backspace" && !search && selectedValues.length > 0) {
              handleRemove(selectedValues[selectedValues.length - 1]);
            }
            if (e.key === "Escape") {
              setIsOpen(false);
              setSearch("");
            }
          }}
        />
        <ChevronDown className="h-4 w-4 text-gray-400 mr-2" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <span className="font-medium">{option.keyCode}</span>
              {option.stringValue !== option.keyCode && (
                <span className="text-gray-500 ml-2">{option.stringValue}</span>
              )}
            </button>
          ))}

          {search.trim() && !exactMatch && !searchMatchesSelected && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-900 border-t border-gray-100"
            >
              <Plus className="h-4 w-4" />
              Create "{search.trim()}"
            </button>
          )}

          {filteredOptions.length === 0 && !search.trim() && (
            <div className="px-3 py-2 text-sm text-gray-500">
              {selectedValues.length > 0 ? "All options selected" : "No options available. Type to create one."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
