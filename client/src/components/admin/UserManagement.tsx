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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Switch
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import EditIcon from '@mui/icons-material/Edit';
import api from '../../utils/axios';

interface User {
  _id: string;
  alias: string;
  nickname: string;
  isActive: boolean;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<{
    newUsers: any[];
    updateUsers: any[];
    unchangedUsers: any[];
  } | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [batchDeleteDialog, setBatchDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    alias: '',
    nickname: ''
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search
        }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (err) {
      console.error('获取用户列表失败', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const rows = text.split(/\r\n|\r|\n/)
            .filter(row => row.trim())
            .slice(1)
            .map(row => {
              const [alias, nickname] = row
                .split(',')
                .map(field => field.trim().replace(/^["']|["']$/g, ''));
              return { alias, nickname };
            })
            .filter(({ alias, nickname }) => alias && nickname);

          const response = await api.post('/api/users/preview-import', { users: rows });
          setImportPreview(response.data);
        } catch (err) {
          alert('解析文件失败');
        }
      };
      reader.readAsText(selectedFile);
    } catch (err) {
      alert('读取文件失败');
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;

    try {
      await api.post('/api/users/batch-import', {
        newUsers: importPreview.newUsers,
        updateUsers: importPreview.updateUsers
      });
      setImportPreview(null);
      setSelectedFile(null);
      fetchUsers();
      alert('导入成功');
    } catch (err) {
      alert('导入失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/users/${id}`);
      fetchUsers();
      setDeleteDialog(false);
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (!selectedUsers.length) return;

    try {
      await api.post('/api/users/batch-delete', { ids: selectedUsers });
      setSelectedUsers([]);
      fetchUsers();
      setBatchDeleteDialog(false);
    } catch (err) {
      alert('批量删除失败');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      if (user.isActive) {
        await api.post(`/api/users/deactivate/${user.alias}`);
      } else {
        await api.post(`/api/users/admin/activate/${user._id}`);
      }
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || `${user.isActive ? '取消激活' : '激活'}失败`);
    }
  };

  const handleEdit = async () => {
    if (!editingUser) return;
    
    try {
      await api.put(`/api/users/${editingUser._id}`, {
        alias: editingUser.alias,
        nickname: editingUser.nickname
      });
      setEditDialog(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '更新用户失败');
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/api/users', newUser);
      setCreateDialog(false);
      setNewUser({ alias: '', nickname: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建用户失败');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="搜索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
        />
        <Button
          variant="contained"
          onClick={() => setCreateDialog(true)}
        >
          创建用户
        </Button>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
        >
          导入用户
          <input
            type="file"
            hidden
            accept=".csv,.txt"
            onChange={handleFileChange}
          />
        </Button>
        {selectedFile && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
          >
            预览导入
          </Button>
        )}
        {selectedUsers.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setBatchDeleteDialog(true)}
          >
            批量删除
          </Button>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(user => user._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </TableCell>
              <TableCell>别名</TableCell>
              <TableCell>昵称</TableCell>
              <TableCell align="center">激活状态</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user._id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{user.alias}</TableCell>
                <TableCell>{user.nickname}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={user.isActive}
                    onChange={() => handleToggleActive(user)}
                    color="primary"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setEditingUser(user);
                      setEditDialog(true);
                    }}
                    title="编辑"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedUsers([user._id]);
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
        rowsPerPageOptions={[10, 25, 50, 100, 200]}
      />

      <Dialog open={!!importPreview} onClose={() => setImportPreview(null)}>
        <DialogTitle>导入预览</DialogTitle>
        <DialogContent>
          <Box>
            <Typography variant="subtitle1">
              新增用户: {importPreview?.newUsers.length || 0}
            </Typography>
            <Typography variant="subtitle1">
              更新用户: {importPreview?.updateUsers.length || 0}
            </Typography>
            <Typography variant="subtitle1">
              无变化: {importPreview?.unchangedUsers.length || 0}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportPreview(null)}>取消</Button>
          <Button onClick={handleConfirmImport} color="primary">
            确认导入
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除该用户吗？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>取消</Button>
          <Button onClick={() => handleDelete(users[0]._id)} color="error">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={batchDeleteDialog} onClose={() => setBatchDeleteDialog(false)}>
        <DialogTitle>确认批量删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除选中的 {selectedUsers.length} 个用户吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDeleteDialog(false)}>取消</Button>
          <Button onClick={handleBatchDelete} color="error">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="别名"
              value={editingUser?.alias || ''}
              onChange={(e) => setEditingUser(prev => prev ? { ...prev, alias: e.target.value } : null)}
              fullWidth
            />
            <TextField
              label="昵称"
              value={editingUser?.nickname || ''}
              onChange={(e) => setEditingUser(prev => prev ? { ...prev, nickname: e.target.value } : null)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>取消</Button>
          <Button onClick={handleEdit} color="primary">保存</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialog} onClose={() => setCreateDialog(false)}>
        <DialogTitle>创建用户</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="别名"
              value={newUser.alias}
              onChange={(e) => setNewUser(prev => ({ ...prev, alias: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="昵称"
              value={newUser.nickname}
              onChange={(e) => setNewUser(prev => ({ ...prev, nickname: e.target.value }))}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>取消</Button>
          <Button 
            onClick={handleCreateUser}
            disabled={!newUser.alias || !newUser.nickname}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 