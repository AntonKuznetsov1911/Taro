import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface MarkdownRendererProps {
  content?: string | null;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderContent = () => {
    const lines = (content ?? '').split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Empty line
      if (line === '') {
        elements.push(<View key={key++} style={styles.spacer} />);
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      const hrMatch = /^([-*_])[ \t]*(?:\1[ \t]*){2,}$/.test(line);
      const bulletMatch = line.match(/^[-*+][ \t]+(.*)$/);
      const numberedMatch = line.match(/^(\d+)\.[ \t]+(.*)$/);

      // Headers (# / ## / ### ...)
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingStyle = level === 1 ? styles.h1 : level === 2 ? styles.h2 : styles.h3;
        elements.push(
          <Text key={key++} style={headingStyle}>
            {parseInlineMarkdown(headingMatch[2])}
          </Text>
        );
      }
      // Horizontal rule (---, ***, ___)
      else if (hrMatch) {
        elements.push(<View key={key++} style={styles.hr} />);
      }
      // Bullet list
      else if (bulletMatch) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              {parseInlineMarkdown(bulletMatch[1])}
            </Text>
          </View>
        );
      }
      // Numbered list
      else if (numberedMatch) {
        elements.push(
          <View key={key++} style={styles.listItem}>
            <Text style={styles.number}>{numberedMatch[1]}.</Text>
            <Text style={styles.listText}>
              {parseInlineMarkdown(numberedMatch[2])}
            </Text>
          </View>
        );
      }
      // Regular paragraph
      else {
        elements.push(
          <Text key={key++} style={styles.paragraph}>
            {parseInlineMarkdown(line)}
          </Text>
        );
      }
    }

    return elements;
  };

  // Служебные символы разметки не должны попадать на экран: непарные * и #
  // (например, «5 * 3» или обрезанный заголовок) убираем из обычного текста.
  const cleanLeftovers = (text: string): string =>
    text.replace(/\*+/g, '').replace(/(^|\s)#{1,6}(?=\s|$)/g, '$1').replace(/[ \t]{2,}/g, ' ');

  const parseInlineMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold with **
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        // Add text before
        if (boldMatch.index > 0) {
          parts.push(
            <Text key={key++}>{cleanLeftovers(remaining.substring(0, boldMatch.index))}</Text>
          );
        }
        // Add bold text
        parts.push(
          <Text key={key++} style={styles.bold}>
            {boldMatch[1]}
          </Text>
        );
        remaining = remaining.substring(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic with *
      const italicMatch = remaining.match(/\*([^*]+)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(
            <Text key={key++}>{cleanLeftovers(remaining.substring(0, italicMatch.index))}</Text>
          );
        }
        parts.push(
          <Text key={key++} style={styles.italic}>
            {italicMatch[1]}
          </Text>
        );
        remaining = remaining.substring(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // No more markdown, add remaining text
      parts.push(<Text key={key++}>{cleanLeftovers(remaining)}</Text>);
      break;
    }

    return parts;
  };

  // Guard: nothing to render for missing / empty / non-string content
  if (typeof content !== 'string' || content.trim() === '') {
    return <View style={styles.container} />;
  }

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginTop: 16,
    marginBottom: 8,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E8E8E8',
    marginTop: 14,
    marginBottom: 8,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    marginTop: 12,
    marginBottom: 6,
    lineHeight: 24,
  },
  paragraph: {
    fontSize: 15,
    color: '#D0D0D0',
    lineHeight: 24,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  italic: {
    fontStyle: 'italic',
    color: '#B8B8B8',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 15,
    color: '#9B59B6',
    marginRight: 8,
    marginTop: 2,
    fontWeight: 'bold',
  },
  number: {
    fontSize: 15,
    color: '#9B59B6',
    marginRight: 8,
    fontWeight: '600',
    minWidth: 24,
  },
  listText: {
    fontSize: 15,
    color: '#D0D0D0',
    lineHeight: 24,
    flex: 1,
  },
  hr: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
    opacity: 0.5,
  },
  spacer: {
    height: 8,
  },
});
