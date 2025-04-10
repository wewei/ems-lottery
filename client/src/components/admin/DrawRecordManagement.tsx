import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import api from '../../utils/axios';

interface DrawRecord {
  _id: string;
  drawTime: string;
  prizeId: string;
  prizeName: string;
  drawQuantity: number;
  winners: Array<{
    alias: string;
    nickname: string;
  }>;
}

const DrawRecordManagement: React.FC = () => {
  const { t } = useTranslation();
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DrawRecord | null>(null);

  const fetchRecords = async () => {
    try {
      const response = await api.get('/api/draw-records', {
        params: {
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setRecords(response.data.records);
      setTotal(response.data.total);
    } catch (err) {
      console.error(t('drawRecord.fetchFailed'), err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      await api.delete(`/api/draw-records/${selectedRecord._id}`);
      setDeleteDialog(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (err) {
      alert(t('drawRecord.deleteFailed'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('drawRecord.drawTime')}</TableCell>
              <TableCell>{t('drawRecord.prize')}</TableCell>
              <TableCell>{t('drawRecord.winners')}</TableCell>
              <TableCell>{t('common.operation')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{formatDate(record.drawTime)}</TableCell>
                <TableCell>{record.prizeName}</TableCell>
                <TableCell>
                  {record.winners.map(winner => 
                    `${winner.nickname}(${winner.alias})`
                  ).join(', ')}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedRecord(record);
                      setDeleteDialog(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 25, 50]}
      />

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>{t('drawRecord.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('drawRecord.confirmDeleteMessage')}
          </Typography>
          {selectedRecord && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t('drawRecord.drawTime')}: {formatDate(selectedRecord.drawTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('drawRecord.prize')}: {selectedRecord.prizeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('drawRecord.winners')}: {selectedRecord.winners.map(w => 
                  `${w.nickname}(${w.alias})`
                ).join(', ')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DrawRecordManagement; 