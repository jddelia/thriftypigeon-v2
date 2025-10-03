import type { PortableTextBlock } from "@/lib/sanity/types";

interface PortableTextProps {
  value: PortableTextBlock[];
}

export function PortableText({ value }: PortableTextProps) {
  if (!value?.length) {
    return null;
  }

  return (
    <div className="prose prose-slate max-w-none">
      {value.map((block, index) => {
        if (block._type === "block") {
          const text = block.children?.map((child) => child.text).join(" ") ?? "";
          return <p key={index}>{text}</p>;
        }

        return (
          <pre className="overflow-auto rounded bg-slate-900 p-4 text-sm text-slate-100" key={index}>
            {JSON.stringify(block, null, 2)}
          </pre>
        );
      })}
    </div>
  );
}
