'use strict';

// Flags hardcoded colors and font families in style objects so every visual
// value is forced to come from `src/theme` tokens instead of being
// re-invented per component.

const COLOR_KEYS = new Set([
  'color',
  'backgroundColor',
  'borderColor',
  'borderTopColor',
  'borderBottomColor',
  'borderLeftColor',
  'borderRightColor',
  'shadowColor',
  'tintColor',
  'overlayColor',
  'placeholderTextColor',
  'selectionColor',
  'underlineColorAndroid',
]);

const FONT_KEYS = new Set(['fontFamily']);

const HEX_COLOR = /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const FUNC_COLOR = /^(rgb|rgba|hsl|hsla)\(/i;

// Deliberately excludes CSS named colors ('red', 'blue', 'purple', ...): those
// words are common as plain data (status/category/type enum values) outside
// of style props, and checking them without the property-key context below
// produced false positives. Hex codes and rgb()/hsl() calls are unambiguous.
function isLikelyColorLiteral(value) {
  if (typeof value !== 'string') return false;
  return HEX_COLOR.test(value) || FUNC_COLOR.test(value);
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw color and font-family values; require design tokens from src/theme',
    },
    schema: [],
    messages: {
      rawColor:
        'Raw color value "{{value}}" is not allowed. Import colors from "@/theme" (e.g. tokens.colors.primary).',
      rawColorKey:
        'Property "{{key}}" must use a token from "@/theme" (tokens.colors.*), not a literal string.',
      rawFont:
        'Raw fontFamily "{{value}}" is not allowed. Use tokens.fontFamily.* from "@/theme" instead.',
    },
  },
  create(context) {
    function checkLiteral(node, key) {
      if (typeof node.value !== 'string') return;

      if (FONT_KEYS.has(key)) {
        context.report({ node, messageId: 'rawFont', data: { value: node.value } });
        return;
      }

      if (COLOR_KEYS.has(key)) {
        context.report({ node, messageId: 'rawColorKey', data: { key } });
        return;
      }

      if (isLikelyColorLiteral(node.value)) {
        context.report({ node, messageId: 'rawColor', data: { value: node.value } });
      }
    }

    return {
      Property(node) {
        const key = node.key.type === 'Identifier' ? node.key.name : node.key.value;
        if (node.value.type === 'Literal') {
          checkLiteral(node.value, key);
        }
      },
      Literal(node) {
        // Catch bare color literals outside of a `key: value` pair, e.g. in
        // arrays passed to gradient components.
        if (node.parent && node.parent.type === 'Property') return;
        if (isLikelyColorLiteral(node.value)) {
          context.report({ node, messageId: 'rawColor', data: { value: node.value } });
        }
      },
    };
  },
};

module.exports = rule;
