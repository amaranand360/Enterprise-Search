'use client';

import React from 'react';

interface IconRendererProps {
  icon: string | React.ComponentType<any>;
  className?: string;
  size?: number;
}

export function IconRenderer({ icon, className = '', size = 16 }: IconRendererProps) {
  // If it's a string (emoji), render it directly
  if (typeof icon === 'string') {
    return <span className={className}>{icon}</span>;
  }

  // If it's a React component, render it with proper props
  if (React.isValidElement(icon)) {
    // If it's already a React element, clone it with new props
    return React.cloneElement(icon, { className, size });
  }

  // If it's a component constructor, render it
  const IconComponent = icon as React.ComponentType<any>;
  return <IconComponent className={className} size={size} />;
}

// Helper function for inline usage
export function renderIcon(icon: string | React.ComponentType<any>, className?: string, size?: number) {
  if (typeof icon === 'string') {
    return <span className={className}>{icon}</span>;
  }

  if (React.isValidElement(icon)) {
    return React.cloneElement(icon, { className, size });
  }

  const IconComponent = icon as React.ComponentType<any>;
  return <IconComponent className={className} size={size} />;
}
