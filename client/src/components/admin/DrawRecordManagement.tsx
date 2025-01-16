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
      console.error('获取抽奖记录失败', err);
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
      alert('删除记录失败');
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
              <TableCell>抽奖时间</TableCell>
              <TableCell>奖项</TableCell>
              <TableCell>中奖者</TableCell>
              <TableCell>操作</TableCell>
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
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这条抽奖记录吗？
          </Typography>
          {selectedRecord && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                时间：{formatDate(selectedRecord.drawTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                奖项：{selectedRecord.prizeName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                中奖者：{selectedRecord.winners.map(w => 
                  `${w.nickname}(${w.alias})`
                ).join(', ')}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>取消</Button>
          <Button onClick={handleDelete} color="error">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DrawRecordManagement; 