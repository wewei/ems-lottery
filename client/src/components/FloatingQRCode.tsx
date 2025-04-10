import React, { useState } from 'react';
import { Box, IconButton, Fade, Typography } from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';

interface FloatingQRCodeProps {
  url: string;
}

const FloatingQRCode: React.FC<FloatingQRCodeProps> = ({ url }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Fade in={!expanded}>
        <Box
          sx={{
            position: 'fixed',
            right: 20,
            bottom: 20,
            cursor: 'pointer',
            zIndex: 1000,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 1,
            boxShadow: 3,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
          onClick={() => setExpanded(true)}
        >
          <QRCodeSVG value={url} size={100} />
        </Box>
      </Fade>

      <Fade in={expanded}>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200
          }}
        >
          <IconButton
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              color: 'white'
            }}
            onClick={() => setExpanded(false)}
          >
            <RemoveIcon />
          </IconButton>
          <Box
            sx={{
              bgcolor: 'white',
              p: 4,
              borderRadius: 2
            }}
          >
            <Typography variant="h4" gutterBottom align="center">
              {t('activate.scanQRCode')}
            </Typography>
            <QRCodeSVG value={url} size={500} />
          </Box>
        </Box>
      </Fade>
    </>
  );
};

export default FloatingQRCode; 