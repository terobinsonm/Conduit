"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";

interface Option {
  id: string;
  keyCode: string;
  stringValue: string;
}

interface ClassificationComboboxProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (keyCode: string) => void;
  onCreateNew: (keyCode: string, stringValue: string) => void;
  placeholder?: string;
}

export function ClassificationCombobox({
  label,
  value,
  options,
  onChange,
  onCreateNew,
  placeholder = "Select or type to create...",
}: ClassificationComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingCreate, setPendingCreate] = useState<{ keyCode: string; stringValue: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.keyCode === value);
  
  // Show pending create value if it matches current value, otherwise show selected option or raw value
  let displayValue = "";
  if (pendingCreate && pendingCreate.keyCode === value) {
    displayValue = pendingCreate.stringValue;
  } else if (selectedOption) {
    displayValue = selectedOption.stringValue;
  } else if (value) {
    displayValue = value;
  }

  const filteredOptions = options.filter(
    (o) =>
      o.keyCode.toLowerCase().includes(search.toLowerCase()) ||
      o.stringValue.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = options.some(
    (o) =>
      o.keyCode.toLowerCase() === search.toLowerCase() ||
      o.stringValue.toLowerCase() === search.toLowerCase()
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
    onChange(option.keyCode);
    setPendingCreate(null);
    setIsOpen(false);
    setSearch("");
  }

  function handleCreate() {
    if (!search.trim()) return;
    const keyCode = search
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
    const stringValue = search.trim();
    
    setPendingCreate({ keyCode, stringValue });
    onCreateNew(keyCode, stringValue);
    onChange(keyCode);
    setIsOpen(false);
    setSearch("");
  }

  function handleClear() {
    onChange("");
    setPendingCreate(null);
    setSearch("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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
                } else if (filteredOptions.length === 1 && filteredOptions[0].keyCode.toLowerCase() === search.toLowerCase()) {
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
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
            >
              <span>
                <span className="font-medium">{option.keyCode}</span>
                {option.stringValue !== option.keyCode && (
                  <span className="text-gray-500 ml-2">{option.stringValue}</span>
                )}
              </span>
              {option.keyCode === value && <Check className="h-4 w-4 text-gray-900" />}
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
