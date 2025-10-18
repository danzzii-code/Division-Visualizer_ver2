import React from 'react';

type BlockType = 'hundred' | 'ten' | 'one';

interface BlockProps {
  type: BlockType;
  colorClass?: string;
}

const Block: React.FC<BlockProps> = ({ type, colorClass }) => {
  const blockStyles = {
    hundred: {
      defaultColor: 'bg-purple-400',
      size: 'w-20 h-20',
      title: '백의 묶음',
    },
    ten: {
      defaultColor: 'bg-sky-400',
      size: 'w-6 h-20',
      title: '십의 묶음',
    },
    one: {
      defaultColor: 'bg-emerald-400',
      size: 'w-6 h-6',
      title: '낱개',
    },
  };

  const style = blockStyles[type];
  const color = colorClass || style.defaultColor;
  const hoverEffect = 'transition-transform duration-150 ease-in-out hover:scale-110 hover:z-10';
  
  return (
    <div 
      className={`relative ${style.size} ${color} rounded border border-slate-600 shadow-sm ${hoverEffect}`} 
      title={style.title}
    />
  );
};

export default Block;