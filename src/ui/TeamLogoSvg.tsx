import React from 'react';
import { LogoDesign } from '../core/types';

interface TeamLogoSvgProps {
  logo: LogoDesign;
  size?: number;
  className?: string;
  idPrefix?: string;
}

export const TeamLogoSvg: React.FC<TeamLogoSvgProps> = ({
  logo,
  size = 56,
  className = '',
  idPrefix = 'logo',
}) => {
  const gradId = `${idPrefix}_grad_${logo.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  const renderBgShape = () => {
    const fill = logo.gradientEnabled ? `url(#${gradId})` : logo.primaryColor;
    const stroke = logo.borderWidth > 0 ? logo.borderColor : 'none';
    const sw = logo.borderWidth;

    switch (logo.bgShape) {
      case 'shield':
        return (
          <path
            d="M50 6 L88 20 L88 52 C88 74 71 88 50 95 C29 88 12 74 12 52 L12 20 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        );
      case 'hexagon':
        return (
          <polygon
            points="50,6 90,28 90,72 50,94 10,72 10,28"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        );
      case 'octagon':
        return (
          <polygon
            points="32,6 68,6 94,32 94,68 68,94 32,94 6,68 6,32"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        );
      case 'crest':
        return (
          <path
            d="M16 10 L84 10 L88 46 C88 75 68 90 50 95 C32 90 12 75 12 46 Z"
            fill={fill}
            stroke={stroke}
            strokeWidth={sw}
          />
        );
      case 'circle':
        return <circle cx="50" cy="50" r="43" fill={fill} stroke={stroke} strokeWidth={sw} />;
      case 'none':
      default:
        return null;
    }
  };

  const renderSymbol = (symbol: LogoDesign['symbol'], color: string) => {
    switch (symbol) {
      case 'wing':
        return (
          <path
            d="M16 44 L44 34 L50 42 L56 34 L84 44 L72 52 L50 46 L28 52 Z"
            fill={color}
          />
        );
      case 'bolt':
        return (
          <polygon
            points="55,18 33,48 48,48 42,74 68,42 52,42"
            fill={color}
          />
        );
      case 'star':
        return (
          <polygon
            points="50,18 57,34 75,36 61,48 65,65 50,56 35,65 39,48 25,36 43,34"
            fill={color}
          />
        );
      case 'crescent':
        return (
          <g fill={color}>
            <path d="M48 22 A18 18 0 1 0 48 58 A14 14 0 1 1 48 22 Z" />
            <polygon points="58,34 61,40 67,40 62,44 64,50 58,46 53,50 55,44 50,40 56,40" />
          </g>
        );
      case 'falcon':
        return (
          <path
            d="M20 34 Q38 24 50 38 Q62 24 80 34 Q65 46 50 54 Q35 46 20 34 Z"
            fill={color}
          />
        );
      case 'chequered':
        return (
          <g fill={color}>
            <rect x="30" y="26" width="10" height="10" />
            <rect x="50" y="26" width="10" height="10" />
            <rect x="40" y="36" width="10" height="10" />
            <rect x="60" y="36" width="10" height="10" />
          </g>
        );
      case 'turbine':
      default:
        return (
          <circle cx="50" cy="40" r="14" fill="none" stroke={color} strokeWidth="5" strokeDasharray="8 5" />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`select-none shrink-0 ${className}`}
      aria-label={logo.name}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={logo.primaryColor} />
          <stop offset="100%" stopColor={logo.secondaryColor} />
        </linearGradient>
      </defs>

      {renderBgShape()}

      {/* Inner accent stripe */}
      <path
        d="M22 62 L78 62"
        stroke={logo.accentColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.85"
      />

      {logo.customImageDataUrl ? (
        <image
          href={logo.customImageDataUrl}
          x="22"
          y="20"
          width="56"
          height="56"
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <>
          <g transform="translate(0, -4)">{renderSymbol(logo.symbol, logo.accentColor)}</g>
          <text
            x="50"
            y="77"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="20"
            fontWeight="700"
            fontFamily={
              logo.fontStyle === 'mono'
                ? 'JetBrains Mono, monospace'
                : logo.fontStyle === 'sans'
                ? 'Plus Jakarta Sans, sans-serif'
                : 'Chakra Petch, sans-serif'
            }
            letterSpacing="1.5"
          >
            {logo.initials.slice(0, 4)}
          </text>
        </>
      )}
    </svg>
  );
};
