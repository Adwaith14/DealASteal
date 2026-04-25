import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type BlogMarkdownProps = {
  markdown: string;
};

export function BlogMarkdown({ markdown }: BlogMarkdownProps) {
  return (
    <div className="blog-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ className, ...props }) => (
            <a
              {...props}
              className={`font-semibold text-red-600 underline hover:text-red-800 ${className ?? ''}`}
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
