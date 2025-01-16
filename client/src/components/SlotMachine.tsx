import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface SlotMachineProps {
  users: Array<{ nickname: string }>;
  drawQuantity: number;
  speed?: number;
  onStop: (selectedIndexes: number[]) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = ({
  users,
  drawQuantity,
  speed = 50,
  onStop
}) => {
  const [currentIndexes, setCurrentIndexes] = useState<number[]>([]);
  const [isSpinning, setIsSpinning] = useState(true);
  const [intervals, setIntervals] = useState<ReturnType<typeof setInterval>[]>([]);

  // 初始化多个老虎机轮子
  useEffect(() => {
    const newIndexes = Array(drawQuantity).fill(0);
    setCurrentIndexes(newIndexes);
    startSpinning();
  }, [drawQuantity]);

  const startSpinning = useCallback(() => {
    // 清除现有的定时器
    intervals.forEach(interval => clearInterval(interval));
    
    // 为每个轮子创建一个定时器
    const newIntervals = Array(drawQuantity).fill(0).map((_, slotIndex) => {
      return setInterval(() => {
        setCurrentIndexes(prev => {
          const next = [...prev];
          next[slotIndex] = (next[slotIndex] + 1) % users.length;
          return next;
        });
      }, speed + slotIndex * 10); // 每个轮子速度略有不同
    });

    setIntervals(newIntervals);
    setIsSpinning(true);
  }, [drawQuantity, speed, users.length]);

  const stopSpinning = () => {
    // 依次停止每个轮子
    intervals.forEach((interval, index) => {
      setTimeout(() => {
        clearInterval(interval);
        if (index === intervals.length - 1) {
          setIsSpinning(false);
          // 生成不重复的随机索引
          const selectedIndexes: number[] = [];
          const usedIndexes = new Set();
          while (selectedIndexes.length < drawQuantity) {
            const randomIndex = Math.floor(Math.random() * users.length);
            if (!usedIndexes.has(randomIndex)) {
              usedIndexes.add(randomIndex);
              selectedIndexes.push(randomIndex);
            }
          }
          setCurrentIndexes(selectedIndexes);
          onStop(selectedIndexes);
        }
      }, index * 200); // 每个轮子延迟200ms停止
    });
  };

  return (
    <Box sx={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1300
    }}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'row',
        gap: 2,
        height: '70vh',
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {currentIndexes.map((index, i) => (
          <Box
            key={i}
            sx={{
              width: `${100 / drawQuantity}%`,
              maxWidth: '200px',
              py: 3,
              backgroundColor: 'background.paper',
              borderRadius: 1,
              boxShadow: 2,
              transition: 'all 0.3s ease',
              mx: 1
            }}
          >
            <Typography variant="h4">
              {users[index]?.nickname || '???'}
            </Typography>
          </Box>
        ))}
      </Box>
      <Button
        variant="contained"
        color="primary"
        size="large"
        onClick={stopSpinning}
        disabled={!isSpinning}
        sx={{ mt: 4 }}
      >
        停止抽奖
      </Button>
    </Box>
  );
};

export default SlotMachine; 