import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * Parses inline formatting tokens:
 * - **bold** or __bold__
 * - *italic* or _italic_
 * - `code`
 */
const renderInlineTokens = (text, baseStyle, isUser) => {
  if (!text) return null;

  // Regex to match **bold**, *italic*, and `code`
  const regex = /(\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*).*?(?<!\*)\*(?!\*)|(?<!_)_(?!_).*?(?<!_)_(?!_)|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text** or __text__
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      const content = part.slice(2, -2);
      return (
        <Text key={index} style={[baseStyle, styles.bold, isUser && styles.userBold]}>
          {content}
        </Text>
      );
    }

    // Italic: *text* or _text_
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const content = part.slice(1, -1);
      return (
        <Text key={index} style={[baseStyle, styles.italic, isUser && styles.userItalic]}>
          {content}
        </Text>
      );
    }

    // Inline Code / Highlight: `text`
    if (part.startsWith('`') && part.endsWith('`')) {
      const content = part.slice(1, -1);
      return (
        <Text key={index} style={[baseStyle, styles.codeInline, isUser && styles.userCodeInline]}>
          {` ${content} `}
        </Text>
      );
    }

    // Regular Text
    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
};

export default function MarkdownMessage({ content, isUser = false }) {
  if (!content || typeof content !== 'string') return null;

  const lines = content.split('\n');
  const elements = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Empty line / spacer
    if (!line) {
      elements.push(<View key={`space_${i}`} style={styles.paragraphSpacer} />);
      continue;
    }

    // Headers: ###, ##, #
    if (line.startsWith('### ')) {
      const headingText = line.replace(/^###\s+/, '');
      elements.push(
        <View key={`h3_${i}`} style={styles.headingWrap}>
          <Text style={[styles.h3, isUser && styles.userH3]}>
            {renderInlineTokens(headingText, styles.h3Text, isUser)}
          </Text>
        </View>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      const headingText = line.replace(/^##\s+/, '');
      elements.push(
        <View key={`h2_${i}`} style={styles.headingWrap}>
          <Text style={[styles.h2, isUser && styles.userH2]}>
            {renderInlineTokens(headingText, styles.h2Text, isUser)}
          </Text>
        </View>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      const headingText = line.replace(/^#\s+/, '');
      elements.push(
        <View key={`h1_${i}`} style={styles.headingWrap}>
          <Text style={[styles.h1, isUser && styles.userH1]}>
            {renderInlineTokens(headingText, styles.h1Text, isUser)}
          </Text>
        </View>
      );
      continue;
    }

    // Bullet points: - item, * item, • item
    const bulletMatch = line.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      const itemText = bulletMatch[1];
      elements.push(
        <View key={`bullet_${i}`} style={styles.bulletRow}>
          <View style={[styles.bulletPoint, isUser && styles.userBulletPoint]} />
          <Text style={[styles.bulletContent, isUser && styles.userText]}>
            {renderInlineTokens(itemText, isUser ? styles.userText : styles.assistantText, isUser)}
          </Text>
        </View>
      );
      continue;
    }

    // Numbered list: 1. item, 2. item
    const numberMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      const num = numberMatch[1];
      const itemText = numberMatch[2];
      elements.push(
        <View key={`num_${i}`} style={styles.numberRow}>
          <View style={[styles.numberBadge, isUser && styles.userNumberBadge]}>
            <Text style={[styles.numberText, isUser && styles.userNumberText]}>{num}</Text>
          </View>
          <Text style={[styles.numberContent, isUser && styles.userText]}>
            {renderInlineTokens(itemText, isUser ? styles.userText : styles.assistantText, isUser)}
          </Text>
        </View>
      );
      continue;
    }

    // Blockquote / Tip: > Tip text or 💡 text
    if (line.startsWith('> ')) {
      const tipText = line.replace(/^>\s+/, '');
      elements.push(
        <View key={`quote_${i}`} style={[styles.quoteBox, isUser && styles.userQuoteBox]}>
          <Text style={[styles.quoteText, isUser && styles.userQuoteText]}>
            {renderInlineTokens(tipText, styles.quoteText, isUser)}
          </Text>
        </View>
      );
      continue;
    }

    // Standard Paragraph Line
    elements.push(
      <Text key={`para_${i}`} style={[styles.paragraph, isUser ? styles.userText : styles.assistantText]}>
        {renderInlineTokens(line, isUser ? styles.userText : styles.assistantText, isUser)}
      </Text>
    );
  }

  return <View style={styles.container}>{elements}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraph: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2B2420',
    marginBottom: 4,
  },
  paragraphSpacer: {
    height: 8,
  },
  assistantText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2B2420',
  },
  userText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  bold: {
    fontWeight: '700',
    color: '#2B2420',
  },
  userBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  italic: {
    fontStyle: 'italic',
  },
  userItalic: {
    fontStyle: 'italic',
    color: '#FAF8F5',
  },
  codeInline: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    backgroundColor: '#EFEAE4',
    color: '#994122',
    borderRadius: 4,
  },
  userCodeInline: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#FFFFFF',
  },
  headingWrap: {
    marginTop: 8,
    marginBottom: 6,
  },
  h1: {
    fontSize: 18,
    fontWeight: '800',
    color: '#994122',
  },
  userH1: {
    color: '#FFFFFF',
  },
  h1Text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#994122',
  },
  h2: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#3A6847',
  },
  userH2: {
    color: '#FFFFFF',
  },
  h2Text: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#3A6847',
  },
  h3: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#2B2420',
  },
  userH3: {
    color: '#FFFFFF',
  },
  h3Text: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#2B2420',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3A6847',
    marginTop: 8,
    marginRight: 8,
  },
  userBulletPoint: {
    backgroundColor: '#FFFFFF',
  },
  bulletContent: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2B2420',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 2,
  },
  numberBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5EBE1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    paddingHorizontal: 4,
  },
  userNumberBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  numberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#994122',
  },
  userNumberText: {
    color: '#FFFFFF',
  },
  numberContent: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#2B2420',
  },
  quoteBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#E8A93F',
    backgroundColor: '#FDFBF7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginVertical: 6,
  },
  userQuoteBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: '#FFFFFF',
  },
  quoteText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontStyle: 'italic',
    color: '#6E615A',
  },
  userQuoteText: {
    color: '#FAF8F5',
  },
});
