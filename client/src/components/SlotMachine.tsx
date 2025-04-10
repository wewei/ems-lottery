import React, { useState, useEffect, useCallback, useRef, useReducer, useMemo } from 'react';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { DEFAULT_COLUMNS, MAX_COLUMNS, MIN_COLUMNS, MAX_DRAW_QUANTITY } from '../constants';

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

const MAX_ROWS = 4;

function getRowSize(drawQuantity: number) {
  let rowSize = DEFAULT_COLUMNS;
  let remaining = (DEFAULT_COLUMNS - drawQuantity % DEFAULT_COLUMNS) % DEFAULT_COLUMNS;
  for (let s = MIN_COLUMNS; s <= MAX_COLUMNS; s++) {
    if (s * MAX_ROWS < drawQuantity) continue;
    const r = (s - drawQuantity % s) % s;
    if (r < remaining) {
      remaining = r;
      rowSize = s;
    }
  }
  return rowSize;
}

const GRADIENTS = [
  'linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)',
  'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
  'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(to right, #fa709a 0%, #fee140 100%)',
  'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
  'linear-gradient(to right, #eea2a2 0%, #bbc1bf 19%, #57c6e1 42%, #b49fda 79%, #7ac5d8 100%)'
];

type SlotMachineState = {
  isSpinning: true;
  currentIndexes: number[];
  users: { nickname: string; alias: string }[];
} | {
  isSpinning: false;
  winners: { nickname: string; alias: string }[];
}

type SlotMachienActions = {
  type: 'start';
  drawQuantity: number;
  users: { nickname: string; alias: string }[];
}
| {
  type: 'next'
} | {
  type: 'stop';
}

const pickRandomNumbers = (quality: number, total: number) => {
  if (quality > total) {
    throw new Error("quality is greater than total");
  }
  const allNumbers = Array.from({ length: total }, (_, i) => i);
  const result: number[] = [];
  while (result.length < quality) {
    const randomIndex = Math.floor(Math.random() * allNumbers.length);
    result.push(allNumbers[randomIndex]);
    allNumbers.splice(randomIndex, 1);
  }
  return result;
}

const generateRandomIndexes = (quality: number, total: number) => {
  if (quality > total) {
    throw new Error("quality is greater than total");
  }
  const result: number[] = [];
  while (result.length < quality) {
    const randomIndex = Math.floor(Math.random() * total);
    if (!result.includes(randomIndex)) {
      result.push(randomIndex);
    }
  }
  return result;
}

const getRandomIndexes = (quality: number, total: number) => {
  if (quality > total) {
    throw new Error("quality is greater than total");
  }
  return total > quality * 3 ? generateRandomIndexes(quality, total) : pickRandomNumbers(quality, total);
}

const slotMachineReducer = (state: SlotMachineState, action: SlotMachienActions): SlotMachineState => {
  switch (action.type) {
    case 'start':
      return {
        isSpinning: true,
        currentIndexes: getRandomIndexes(action.drawQuantity, action.users.length),
        users: action.users,
      };
    case 'next':
      return state.isSpinning
        ? {
            ...state,
            currentIndexes: getRandomIndexes(state.currentIndexes.length, state.users.length),
          }
        : state;
    case 'stop':
      return state.isSpinning
        ? {
            isSpinning: false,
            winners: state.currentIndexes.map((index) => state.users[index]),
          }
        : state;
  }
}

const SlotMachine: React.FC<SlotMachineProps> = ({
  users,
  drawQuantity,
  speed = 50,
  onStop,
  onReturn
}) => {
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(slotMachineReducer, {
    users,
    isSpinning: true,
    currentIndexes: getRandomIndexes(drawQuantity, users.length),
  });
  useEffect(() => {
    const interval = state.isSpinning ? setInterval(() => {
      dispatch({ type: 'next' });
    }, speed) : null;
    if (!state.isSpinning) {
      onStop(state.winners);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    }
  }, [state.isSpinning]);

  const getRandomShape = useCallback(() => {
    return SHAPES[Math.floor(Math.random() * SHAPES.length)];
  }, []);

  const getRandomGradient = useCallback(() => {
    return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  }, []);

  const shapes = useMemo(() => 
    Array(MAX_DRAW_QUANTITY).fill(0).map(() => getRandomShape())
  , []);

  const gradients = useMemo(() =>
    Array(MAX_DRAW_QUANTITY).fill(0).map(() => getRandomGradient())
  , []);

  const selectedUsers = useMemo(
    () =>
      state.isSpinning
        ? state.currentIndexes.map((index) => state.users[index])
        : state.winners,
    [state]
  );
  const quality = useMemo(() => selectedUsers.length, [selectedUsers]);
  const rowSize = useMemo(() => getRowSize(quality), [quality]);

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
        {Array.from({ length: Math.min(4, Math.ceil(quality / rowSize)) }).map((_, rowIndex) => (
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
            {selectedUsers.slice(rowIndex * rowSize, Math.min((rowIndex + 1) * rowSize, quality)).map((user, i) => (
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
                    background: gradients[rowIndex * rowSize + i],
                    clipPath: shapes[rowIndex * rowSize + i],
                    transition: 'transform 0.3s ease',
                    animation: state.isSpinning ? 'spin 2s linear infinite' : 'none',
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
                    {user?.nickname || '???'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: '0.9rem' }}
                  >
                    {user?.alias || '???'}
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
        {state.isSpinning ? (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => dispatch({ type: 'stop' })}
            sx={{ 
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
              borderRadius: 2
            }}
          >
            {t('lottery.stop')}
          </Button>
        ) : drawQuantity > 0 ? (
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => {
              dispatch({ type: 'start', drawQuantity, users });
              console.log("start with users", users);
            }}
            sx={{ 
              px: 4,
              py: 1.5,
              fontSize: '1.2rem',
              borderRadius: 2
            }}
          >
            {t('lottery.start')}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={onReturn}
          >
            {t('common.return')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SlotMachine; 