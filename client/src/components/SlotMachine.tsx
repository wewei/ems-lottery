import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';

interface SlotMachineProps {
  users: Array<{
    nickname: string;
    alias: string;
  }>;
  drawQuantity: number;
  speed?: number;
  onStop: (selectedUsers: { nickname: string; alias: string }[]) => void;
  onReturn: () => void;
}

const SHAPES = [
  'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', // 五边形
  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // 菱形
  'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', // 六边形
  'circle(50% at 50% 50%)', // 圆形
  'polygon(0% 0%, 100% 0%, 100% 100%)', // 三角形
];

const GRADIENTS = [
  'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
  'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
  'linear-gradient(to right, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%)'
];

const SlotMachine: React.FC<SlotMachineProps> = ({
  users,
  drawQuantity,
  speed = 50,
  onStop,
  onReturn
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
    // 清除所有定时器
    intervals.forEach(interval => clearInterval(interval));
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
    const selectedUsers = selectedIndexes.map(index => users[index]);
    console.log('selectedUsers', selectedUsers);
    onStop(selectedUsers);
  };

  const getRandomShape = useCallback(() => {
    return SHAPES[Math.floor(Math.random() * SHAPES.length)];
  }, []);

  const getRandomGradient = useCallback(() => {
    return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  }, []);

  const [shapes] = useState(() => 
    Array(drawQuantity).fill(0).map(() => getRandomShape())
  );

  const [gradients] = useState(() =>
    Array(drawQuantity).fill(0).map(() => getRandomGradient())
  );

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
        flexDirection: 'column',
        gap: 3,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '1200px',
        px: 2
      }}>
        {Array.from({ length: Math.min(4, Math.ceil(drawQuantity / 6)) }).map((_, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 3,
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            {currentIndexes.slice(rowIndex * 6, Math.min((rowIndex + 1) * 6, drawQuantity)).map((index, i) => (
              <Card
                key={i}
                sx={{
                  width: 200,
                  height: 280,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    mt: 3,
                    mb: 2,
                    background: gradients[rowIndex * 6 + i],
                    clipPath: shapes[rowIndex * 6 + i],
                    transition: 'transform 0.3s ease',
                    animation: isSpinning ? 'spin 2s linear infinite' : 'none',
                    filter: 'hue-rotate(0deg)',
                    '@keyframes spin': {
                      '0%': { 
                        transform: 'rotate(0deg)',
                        filter: 'hue-rotate(0deg)'
                      },
                      '50%': {
                        filter: 'hue-rotate(180deg)'
                      },
                      '100%': { 
                        transform: 'rotate(360deg)',
                        filter: 'hue-rotate(360deg)'
                      }
                    }
                  }}
                />
                <CardContent sx={{ textAlign: 'center', pt: 0 }}>
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      mb: 1,
                      fontWeight: 'bold',
                      fontSize: '1.8rem',
                      lineHeight: 1.2
                    }}
                  >
                    {users[index]?.nickname || '???'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {users[index]?.alias || '???'}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        ))}
      </Box>
      <Box sx={{ 
        display: 'flex',
        gap: 2,
        mt: 4
      }}>
        {isSpinning && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={stopSpinning}
            sx={{ 
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
              borderRadius: 2
            }}
          >
            停止抽奖
          </Button>
        )}
        {!isSpinning && (
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={onReturn}
            sx={{ 
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
              borderRadius: 2
            }}
          >
            返回
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SlotMachine; 