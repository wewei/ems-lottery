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
import AddIcon from '@mui/icons-material/Add';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
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
  const [batchActivateDialog, setBatchActivateDialog] = useState(false);
  const [batchDeactivateDialog, setBatchDeactivateDialog] = useState(false);
  const [activateAllDialog, setActivateAllDialog] = useState(false);
  const [deactivateAllDialog, setDeactivateAllDialog] = useState(false);

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
      await api.post(`/api/users/${editingUser._id}`, {
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

  const handleBatchActivate = async () => {
    try {
      const aliases = selectedUsers
        .map(id => users.find(u => u._id === id))
        .filter(user => user && !user.isActive)
        .map(user => user!.alias);

      if (aliases.length === 0) {
        alert('没有需要激活的用户');
        return;
      }

      const response = await api.post('/api/users/batch-activate', { aliases });
      
      if (response.data.activated.length > 0) {
        alert(`成功激活 ${response.data.activated.length} 个用户`);
      }

      setSelectedUsers([]);
      fetchUsers();
      setBatchActivateDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || '批量激活失败');
    }
  };

  const handleBatchDeactivate = async () => {
    try {
      const aliases = selectedUsers
        .map(id => users.find(u => u._id === id))
        .filter(user => user && user.isActive)
        .map(user => user!.alias);

      if (aliases.length === 0) {
        alert('没有需要取消激活的用户');
        return;
      }

      const response = await api.post('/api/users/batch-deactivate', { aliases });

      if (response.data.deactivated.length > 0) {
        alert(`成功取消激活 ${response.data.deactivated.length} 个用户`);
      }

      setSelectedUsers([]);
      fetchUsers();
      setBatchDeactivateDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || '批量取消激活失败');
    }
  };

  const handleGenerateTestUsers = async () => {
    try {
      const response = await api.post('/api/users/generate-test?count=10');
      alert(response.data.message);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '生成测试用户失败');
    }
  };

  const handleDeleteTestUsers = async () => {
    try {
      const response = await api.post('/api/users/delete-test-users');
      alert(response.data.message);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '删除测试用户失败');
    }
  };

  const handleActivateAll = async () => {
    try {
      const response = await api.post('/api/users/activate-all');
      alert(`成功激活 ${response.data.activated} 个用户`);
      fetchUsers();
      setActivateAllDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || '全部激活失败');
    }
  };

  const handleDeactivateAll = async () => {
    try {
      const response = await api.post('/api/users/deactivate-all');
      alert(`成功取消激活 ${response.data.deactivated} 个用户`);
      fetchUsers();
      setDeactivateAllDialog(false);
    } catch (err: any) {
      alert(err.response?.data?.message || '全部取消激活失败');
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
          color="info"
          startIcon={<AddIcon />}
          onClick={handleGenerateTestUsers}
        >
          生成测试用户
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<CleaningServicesIcon />}
          onClick={handleDeleteTestUsers}
        >
          清理测试用户
        </Button>
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
        <Button
          variant="contained"
          color="success"
          onClick={() => setActivateAllDialog(true)}
        >
          全部激活
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => setDeactivateAllDialog(true)}
        >
          全部取消激活
        </Button>
        {selectedUsers.length > 0 && (
          <>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteSweepIcon />}
              onClick={() => setBatchDeleteDialog(true)}
            >
              批量删除
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setBatchActivateDialog(true)}
              disabled={!selectedUsers.some(id => 
                users.find(u => u._id === id && !u.isActive)
              )}
            >
              批量激活
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={() => setBatchDeactivateDialog(true)}
              disabled={!selectedUsers.some(id => 
                users.find(u => u._id === id && u.isActive)
              )}
            >
              批量取消激活
            </Button>
          </>
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

      <Dialog open={batchActivateDialog} onClose={() => setBatchActivateDialog(false)}>
        <DialogTitle>确认批量激活</DialogTitle>
        <DialogContent>
          <Typography>
            确定要激活选中的 {selectedUsers.length} 个用户吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchActivateDialog(false)}>取消</Button>
          <Button onClick={handleBatchActivate} color="success">
            确认激活
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={batchDeactivateDialog} onClose={() => setBatchDeactivateDialog(false)}>
        <DialogTitle>确认批量取消激活</DialogTitle>
        <DialogContent>
          <Typography>
            确定要取消激活选中的 {
              selectedUsers.filter(id => 
                users.find(u => u._id === id && u.isActive)
              ).length
            } 个用户吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDeactivateDialog(false)}>取消</Button>
          <Button onClick={handleBatchDeactivate} color="warning">
            确认取消激活
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={activateAllDialog} onClose={() => setActivateAllDialog(false)}>
        <DialogTitle>确认全部激活</DialogTitle>
        <DialogContent>
          <Typography>
            确定要激活所有未激活的用户吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateAllDialog(false)}>取消</Button>
          <Button onClick={handleActivateAll} color="success">
            确认激活
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deactivateAllDialog} onClose={() => setDeactivateAllDialog(false)}>
        <DialogTitle>确认全部取消激活</DialogTitle>
        <DialogContent>
          <Typography>
            确定要取消激活所有已激活的用户吗？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateAllDialog(false)}>取消</Button>
          <Button onClick={handleDeactivateAll} color="warning">
            确认取消激活
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement; 