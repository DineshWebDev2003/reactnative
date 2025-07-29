import React from 'react';
import { Text } from 'react-native';

const SafeIcon = ({ type, name, size, color, style }) => {
  // Fallback icon mapping for common icons
  const fallbackIcons = {
    'currency-rupee': '₹',
    'location-city': '🏢',
    'user-graduate': '🎓',
    'users': '👥',
    'location-on': '📍',
    'user-plus': '➕',
    'chatbubble-ellipses-outline': '💬',
    'video': '📹',
    'settings': '⚙️',
    'event-available': '📅',
    'rupee-sign': '₹',
    'exclamation-circle': '⚠️',
    'id-card': '🆔',
    'arrow-back': '←',
    'date-range': '📅',
    'apps': '📱',
    'error': '❌',
    'assignment': '📝',
    'assignment-turned-in': '✅',
    'people': '👥',
    'chat': '💬',
    'notifications': '🔔',
  };

  try {
    // Try to use the actual icon component
    switch (type) {
      case 'MaterialIcons':
        const MaterialIcons = require('@expo/vector-icons/MaterialIcons').default;
        return <MaterialIcons name={name} size={size} color={color} style={style} />;
      case 'FontAwesome5':
        const FontAwesome5 = require('@expo/vector-icons/FontAwesome5').default;
        return <FontAwesome5 name={name} size={size} color={color} style={style} />;
      case 'Ionicons':
        const Ionicons = require('@expo/vector-icons/Ionicons').default;
        return <Ionicons name={name} size={size} color={color} style={style} />;
      case 'Entypo':
        const Entypo = require('@expo/vector-icons/Entypo').default;
        return <Entypo name={name} size={size} color={color} style={style} />;
      case 'Feather':
        const Feather = require('@expo/vector-icons/Feather').default;
        return <Feather name={name} size={size} color={color} style={style} />;
      default:
        throw new Error('Unknown icon type');
    }
  } catch (error) {
    console.warn('Icon loading error for', type, name, ':', error);
    
    // Use fallback emoji or text
    const fallback = fallbackIcons[name] || '●';
    return (
      <Text style={[
        { 
          fontSize: size, 
          color, 
          textAlign: 'center',
          lineHeight: size 
        }, 
        style
      ]}>
        {fallback}
      </Text>
    );
  }
};

export default SafeIcon; 