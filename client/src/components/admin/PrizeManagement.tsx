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
import EditIcon from '@mui/icons-material/Edit';
import api from '../../utils/axios';

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
  const [editDialog, setEditDialog] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [newPrize, setNewPrize] = useState({
    name: '',
    image: '',
    totalQuantity: 0,
    drawQuantity: 1
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchPrizes = async () => {
    try {
      const response = await api.get('/api/prizes', {
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
        const response = await api.post('/api/prizes/upload', formData);
        setNewPrize(prev => ({ ...prev, image: response.data.url }));
        setImagePreview(response.data.url);
      } catch (err) {
        alert('上传图片失败');
      }
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/api/prizes', newPrize);
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
      await api.delete(`/api/prizes/${selectedPrize._id}`);
      setDeleteDialog(false);
      setSelectedPrize(null);
      fetchPrizes();
    } catch (err) {
      alert('删除奖项失败');
    }
  };

  const handleEdit = async () => {
    if (!editingPrize) return;
    
    try {
      await api.post(`/api/prizes/${editingPrize._id}`, editingPrize);
      setEditDialog(false);
      setEditingPrize(null);
      fetchPrizes();
    } catch (err) {
      alert('更新奖项失败');
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
              <TableCell>每次抽取数量</TableCell>
              <TableCell>剩余数量</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prizes.map((prize) => (
              <TableRow key={prize._id}>
                <TableCell>{prize.name}</TableCell>
                <TableCell>
                  {prize.image && (
                    <img
                      src={prize.image}
                      alt={prize.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                </TableCell>
                <TableCell>{prize.totalQuantity}</TableCell>
                <TableCell>{prize.drawQuantity}</TableCell>
                <TableCell>{prize.remaining}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setEditingPrize(prize);
                      setImagePreview(prize.image);
                      setEditDialog(true);
                    }}
                    title="编辑"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedPrize(prize);
                      setDeleteDialog(true);
                    }}
                    title="删除"
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {imagePreview && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <img
                  src={imagePreview}
                  alt="预览"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            )}
            <TextField
              label="名称"
              value={newPrize.name}
              onChange={(e) => setNewPrize(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
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
              type="number"
              label="抽取数量"
              value={newPrize.drawQuantity}
              onChange={(e) => setNewPrize(prev => ({ 
                ...prev, 
                drawQuantity: Math.min(5, Math.max(1, parseInt(e.target.value)))
              }))}
              inputProps={{ min: 1, max: 5 }}
              helperText="每轮抽奖数量范围：1-5"
              fullWidth
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

      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>编辑奖项</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {imagePreview && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt="预览"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '200px',
                    objectFit: 'contain'
                  }}
                />
              </Box>
            )}
            <TextField
              label="名称"
              value={editingPrize?.name || ''}
              onChange={(e) => setEditingPrize(prev => prev ? { ...prev, name: e.target.value } : null)}
              fullWidth
            />
            <TextField
              type="number"
              label="总数量"
              value={editingPrize?.totalQuantity || 0}
              onChange={(e) => setEditingPrize(prev => prev ? { ...prev, totalQuantity: parseInt(e.target.value) } : null)}
              fullWidth
            />
            <TextField
              type="number"
              label="抽取数量"
              value={editingPrize?.drawQuantity || 1}
              onChange={(e) => setEditingPrize(prev => prev ? {
                ...prev,
                drawQuantity: Math.min(5, Math.max(1, parseInt(e.target.value)))
              } : null)}
              inputProps={{ min: 1, max: 5 }}
              helperText="每轮抽奖数量范围：1-5"
              fullWidth
            />
            <Button
              variant="contained"
              component="label"
              startIcon={<ImageIcon />}
            >
              更换图片
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>取消</Button>
          <Button onClick={handleEdit} color="primary">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrizeManagement; 