import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  TextField,
  IconButton,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ImageIcon from '@mui/icons-material/Image';
import axios from 'axios';

interface Prize {
  _id: string;
  name: string;
  image: string;
  totalQuantity: number;
  drawQuantity: number;
  remaining: number;
}

const PrizeManagement: React.FC = () => {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [createDialog, setCreateDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [newPrize, setNewPrize] = useState({
    name: '',
    image: '',
    totalQuantity: 0,
    drawQuantity: 1
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchPrizes = async () => {
    try {
      const response = await axios.get('/api/prizes', {
        params: {
          page: page + 1,
          limit: rowsPerPage
        }
      });
      setPrizes(response.data.prizes);
      setTotal(response.data.total);
    } catch (err) {
      console.error('获取奖项列表失败', err);
    }
  };

  useEffect(() => {
    fetchPrizes();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await axios.post('/api/prizes/upload', formData);
        setNewPrize(prev => ({ ...prev, image: response.data.url }));
        setImagePreview(response.data.url);
      } catch (err) {
        alert('上传图片失败');
      }
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post('/api/prizes', newPrize);
      setCreateDialog(false);
      setNewPrize({
        name: '',
        image: '',
        totalQuantity: 0,
        drawQuantity: 1
      });
      setImagePreview(null);
      fetchPrizes();
    } catch (err) {
      alert('创建奖项失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedPrize) return;

    try {
      await axios.delete(`/api/prizes/${selectedPrize._id}`);
      setDeleteDialog(false);
      setSelectedPrize(null);
      fetchPrizes();
    } catch (err) {
      alert('删除奖项失败');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => setCreateDialog(true)}
        >
          新增奖项
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名称</TableCell>
              <TableCell>图片</TableCell>
              <TableCell>总数量</TableCell>
              <TableCell>抽取数量</TableCell>
              <TableCell>剩余数量</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prizes.map((prize) => (
              <TableRow key={prize._id}>
                <TableCell>{prize.name}</TableCell>
                <TableCell>
                  <img 
                    src={prize.image} 
                    alt={prize.name} 
                    style={{ width: 50, height: 50, objectFit: 'cover' }} 
                  />
                </TableCell>
                <TableCell>{prize.totalQuantity}</TableCell>
                <TableCell>{prize.drawQuantity}</TableCell>
                <TableCell>{prize.remaining}</TableCell>
                <TableCell>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedPrize(prize);
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

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
        <DialogTitle>新增奖项</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="名称"
              value={newPrize.name}
              onChange={(e) => setNewPrize(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="总数量"
              value={newPrize.totalQuantity}
              onChange={(e) => setNewPrize(prev => ({ ...prev, totalQuantity: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="number"
              label="抽取数量"
              value={newPrize.drawQuantity}
              onChange={(e) => setNewPrize(prev => ({ ...prev, drawQuantity: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              component="label"
              startIcon={<ImageIcon />}
            >
              上传图片
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mb: 2, mt: 2 }}>
                <img 
                  src={imagePreview} 
                  alt="预览" 
                  style={{ width: 100, height: 100, objectFit: 'cover' }} 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>取消</Button>
          <Button onClick={handleCreate} color="primary">
            创建
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除奖项 "{selectedPrize?.name}" 吗？
          </Typography>
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

export default PrizeManagement; 