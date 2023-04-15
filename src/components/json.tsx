import React from "react";
import { Disclosure } from "@headlessui/react";
import { DateTime } from "luxon";
import Timestamp from "@/components/timestamp";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

type Props = {
  json: object;
};

const renderValue = (value: any) => {
  if (DateTime.isDateTime(value) || DateTime.fromISO(value).isValid) {
    return <Timestamp timestamp={value as unknown as string} />;
  }

  switch (typeof value) {
    case "string":
      return `"${value}"`;
    case "object":
      return value === null ? "null" : "Object";
    default:
      return value;
  }
};

const renderNode = (key: string, value: any, level: number): JSX.Element => {
  if (key === "url") {
    return (
      <li key={key}>
        {key}:{" "}
        <a className="underline" href={value} target="_blank" rel="noreferrer">
          {value.split("?")[0]}
        </a>
      </li>
    );
  }

  if (Array.isArray(value)) {
    const items = value.map((item, index) => {
      const node = renderNode(index.toString(), item, level + 1);
      return <React.Fragment key={index}>{node}</React.Fragment>;
    });

    return (
      <li key={key}>
        {key}: <ul>{items}</ul>
      </li>
    );
  } else if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    const nodes = entries.map(([nestedKey, nestedValue]) => {
      const node = renderNode(nestedKey, nestedValue, level + 1);
      return <React.Fragment key={nestedKey}>{node}</React.Fragment>;
    });

    return (
      <li key={key}>
        <Disclosure>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full items-center justify-between bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring focus:ring-blue-500">
                <span>{key}</span>
                <span className="flex items-center">
                  {open ? (
                    <MinusIcon className="h-4 w-4" />
                  ) : (
                    <PlusIcon className="h-4 w-4" />
                  )}
                </span>
              </Disclosure.Button>

              <Disclosure.Panel
                className={`${
                  level > 1 ? "hidden" : ""
                } px-4 pb-2 pt-4 text-sm text-gray-500`}
              >
                <ul className="pl-4">{nodes}</ul>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </li>
    );
  } else {
    return (
      <li key={key}>
        {key}: {renderValue(value)}
      </li>
    );
  }
};

const Json: React.FC<Props> = ({ json }) => {
  return (
    <pre className="rounded-lg bg-gray-800 p-4 text-white shadow-lg">
      <code>
        <ul className="list-disc pl-4">
          {Object.entries(json).map(([key, value]) =>
            renderNode(key, value, 1)
          )}
        </ul>
      </code>
    </pre>
  );
};

export default Json;
