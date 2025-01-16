import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  IconButton,
  Input,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  Toolbar,
  alpha
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Admin: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [resetDialog, setResetDialog] = useState(false);
  const [users, setUsers] = useState<Array<{
    _id: string;
    alias: string;
    nickname: string;
    isActive: boolean;
  }>>([]);
  const [prizes, setPrizes] = useState<Array<{
    _id: string;
    name: string;
    image: string;
    totalQuantity: number;
    drawQuantity: number;
    remaining: number;
  }>>([]);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditType] = useState<'user' | 'prize'>('user');
  const [addUserDialog, setAddUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    alias: '',
    nickname: ''
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteUser, setDeleteUser] = useState<{_id: string, nickname: string} | null>(null);
  const [importDialog, setImportDialog] = useState(false);
  const [previewData, setPreviewData] = useState<{
    newUsers: Array<{ alias: string; nickname: string }>;
    updateUsers: Array<{ alias: string; nickname: string }>;
    unchangedUsers: Array<{ alias: string; nickname: string }>;
  }>({ newUsers: [], updateUsers: [], unchangedUsers: [] });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 设置请求拦截器
    const interceptor = axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // 设置响应拦截器
    const responseInterceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      // 清理拦截器
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
    fetchPrizes();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        `/api/users?page=${page + 1}&limit=${rowsPerPage}&search=${searchTerm}`
      );
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err) {
      console.error('获取用户列表失败', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchPrizes = async () => {
    try {
      const response = await axios.get('/api/prizes');
      setPrizes(response.data.prizes || []);
    } catch (err) {
      console.error('获取奖项列表失败', err);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const response = await axios.post('/api/auth/reset-password');
      alert('管理员已重置，请重新初始化');
      localStorage.removeItem('token');
      navigate('/login');
    } catch (err) {
      alert('密码修改失败');
    }
    setResetDialog(false);
  };

  const handleEdit = (item: any, type: 'user' | 'prize') => {
    setEditItem(item);
    setEditType(type);
    setEditDialog(true);
  };

  const handleSave = async () => {
    try {
      if (editType === 'user') {
        await axios.put(`/api/users/${editItem._id}`, editItem);
      } else {
        await axios.put(`/api/prizes/${editItem._id}`, editItem);
      }
      setEditDialog(false);
      if (editType === 'user') {
        fetchUsers();
      } else {
        fetchPrizes();
      }
    } catch (err) {
      alert('保存失败');
    }
  };

  const handleAddUser = async () => {
    try {
      await axios.post('/api/users', newUser);
      setAddUserDialog(false);
      setNewUser({ alias: '', nickname: '' });
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || '添加用户失败');
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await axios.put(`/api/users/${userId}`, {
        isActive: !currentStatus
      });
      fetchUsers();
    } catch (err) {
      alert('更新状态失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    
    try {
      await axios.delete(`/api/users/${deleteUser._id}`);
      fetchUsers();
      setDeleteDialog(false);
      setDeleteUser(null);
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      // 统一换行符，然后分割
      const rows = text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(row => row.trim())
        .filter(Boolean);
      
      // 移除 BOM 和引号
      const headers = rows[0].replace(/^\uFEFF/, '').replace(/['"]/g, '').toLowerCase().split(',');
      const aliasIndex = headers.findIndex(h => h.toLowerCase() === 'alias');
      const nicknameIndex = headers.findIndex(h => h.toLowerCase() === 'nickname');
      console.log(headers);
      console.log(aliasIndex, nicknameIndex);
      
      if (aliasIndex === -1 || nicknameIndex === -1) {
        alert('CSV 文件必须包含 Alias 和 Nickname 列');
        return;
      }
      
      const users = rows.slice(1).map(row => {
        const cols = row.split(',').map(col => col.trim().replace(/['"]/g, ''));
        if (!cols[aliasIndex] || !cols[nicknameIndex]) return null;
        return {
          alias: cols[aliasIndex],
          nickname: cols[nicknameIndex]
        };
      }).filter(Boolean);
      
      if (users.length === 0) {
        alert('没有找到有效的用户数据');
        return;
      }
      
      try {
        const response = await axios.post('/api/users/preview-import', { users });
        setPreviewData(response.data);
        setImportDialog(true);
        // 清理文件输入，允许重复选择同一文件
        event.target.value = '';
      } catch (err) {
        alert('预览导入数据失败');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    try {
      await axios.post('/api/users/batch-import', previewData);
      setImportDialog(false);
      fetchUsers();
      alert('导入成功');
    } catch (err) {
      alert('导入失败');
    }
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((user) => user._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (_: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];
    
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleBatchDelete = async () => {
    try {
      await axios.post('/api/users/batch-delete', { ids: selected });
      setSelected([]);
      fetchUsers();
      alert('删除成功');
    } catch (err) {
      alert('批量删除失败');
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchTerm(value);
    
    // 清除之前的定时器
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // 设置新的定时器，300ms 后执行搜索
    const timeoutId = setTimeout(() => {
      setPage(0); // 重置到第一页
      fetchUsers();
    }, 300);
    
    setSearchTimeout(timeoutId);
  };

  return (
    <Container>
      <Box sx={{ width: '100%', mt: 4 }}>
        <Paper>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="密码重置" />
            <Tab label="用户管理" />
            <Tab label="奖项管理" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="warning"
                onClick={() => setResetDialog(true)}
                sx={{ mt: 2 }}
              >
                重置管理员密码
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="搜索用户"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="输入别名或昵称搜索..."
                sx={{ width: 250 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddUserDialog(true)}
              >
                添加用户
              </Button>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
              >
                导入 CSV
                <Input
                  type="file"
                  sx={{ display: 'none' }}
                  onChange={handleFileUpload}
                  inputProps={{ accept: '.csv' }}
                />
              </Button>
              {selected.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={() => {
                    if (window.confirm(`确定要删除选中的 ${selected.length} 个用户吗？`)) {
                      handleBatchDelete();
                    }
                  }}
                >
                  删除选中 ({selected.length})
                </Button>
              )}
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selected.length > 0 && selected.length < users.length}
                        checked={users.length > 0 && selected.length === users.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell>别名</TableCell>
                    <TableCell>昵称</TableCell>
                    <TableCell align="center">状态</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user._id}
                      selected={selected.indexOf(user._id) !== -1}
                      hover
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.indexOf(user._id) !== -1}
                          onClick={(event) => handleSelectClick(event, user._id)}
                        />
                      </TableCell>
                      <TableCell>{user.alias}</TableCell>
                      <TableCell>{user.nickname}</TableCell>
                      <TableCell align="center">
                        <Switch
                          checked={user.isActive}
                          onChange={() => handleToggleActive(user._id, user.isActive)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          onClick={() => handleEdit(user, 'user')}
                        >
                          编辑
                        </Button>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setDeleteUser(user);
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
              count={totalUsers}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 20, 50]}
              labelRowsPerPage="每页行数"
              labelDisplayedRows={({ from, to, count }) => 
                `${from}-${to} 共 ${count !== -1 ? count : `超过 ${to}`}`
              }
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <List>
              {prizes.map((prize) => (
                <ListItem
                  key={prize._id}
                  secondaryAction={
                    <Button onClick={() => handleEdit(prize, 'prize')}>
                      编辑
                    </Button>
                  }
                >
                  <ListItemText
                    primary={prize.name}
                    secondary={`剩余数量: ${prize.remaining}/${prize.totalQuantity}`}
                  />
                </ListItem>
              ))}
            </List>
          </TabPanel>

          <Dialog open={addUserDialog} onClose={() => setAddUserDialog(false)}>
            <DialogTitle>添加新用户</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="别名"
                margin="normal"
                value={newUser.alias}
                onChange={(e) =>
                  setNewUser({ ...newUser, alias: e.target.value })
                }
                helperText="用户的唯一标识符"
              />
              <TextField
                fullWidth
                label="昵称"
                margin="normal"
                value={newUser.nickname}
                onChange={(e) =>
                  setNewUser({ ...newUser, nickname: e.target.value })
                }
                helperText="显示用的名称"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddUserDialog(false)}>取消</Button>
              <Button 
                onClick={handleAddUser}
                disabled={!newUser.alias || !newUser.nickname}
              >
                添加
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={editDialog} onClose={() => setEditDialog(false)}>
            <DialogTitle>
              {editType === 'user' ? '编辑用户' : '编辑奖项'}
            </DialogTitle>
            <DialogContent>
              {editType === 'user' ? (
                <>
                  <TextField
                    fullWidth
                    label="别名"
                    margin="normal"
                    value={editItem?.alias || ''}
                    onChange={(e) =>
                      setEditItem({ ...editItem, alias: e.target.value })
                    }
                  />
                  <TextField
                    fullWidth
                    label="昵称"
                    margin="normal"
                    value={editItem?.nickname || ''}
                    onChange={(e) =>
                      setEditItem({ ...editItem, nickname: e.target.value })
                    }
                  />
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="奖项名称"
                    margin="normal"
                    value={editItem?.name || ''}
                    onChange={(e) =>
                      setEditItem({ ...editItem, name: e.target.value })
                    }
                  />
                  <TextField
                    fullWidth
                    label="图片URL"
                    margin="normal"
                    value={editItem?.image || ''}
                    onChange={(e) =>
                      setEditItem({ ...editItem, image: e.target.value })
                    }
                  />
                  <TextField
                    fullWidth
                    label="总数量"
                    type="number"
                    margin="normal"
                    value={editItem?.totalQuantity || 0}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        totalQuantity: parseInt(e.target.value)
                      })
                    }
                  />
                  <TextField
                    fullWidth
                    label="每次抽取数量"
                    type="number"
                    margin="normal"
                    value={editItem?.drawQuantity || 1}
                    onChange={(e) =>
                      setEditItem({
                        ...editItem,
                        drawQuantity: parseInt(e.target.value)
                      })
                    }
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditDialog(false)}>取消</Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogActions>
          </Dialog>

          <Dialog open={resetDialog} onClose={() => setResetDialog(false)}>
            <DialogTitle>确认重置密码</DialogTitle>
            <DialogContent>
              <Typography>
                确定要重置管理员密码吗？重置后将返回登录页面。
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setResetDialog(false)}>取消</Button>
              <Button onClick={handlePasswordReset} color="warning">
                确认重置
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
            <DialogTitle>确认删除</DialogTitle>
            <DialogContent>
              <Typography>
                确定要删除用户 "{deleteUser?.nickname}" 吗？此操作不可恢复。
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog(false)}>取消</Button>
              <Button onClick={handleDelete} color="error">
                删除
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={importDialog}
            onClose={() => setImportDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>导入预览</DialogTitle>
            <DialogContent>
              {previewData.newUsers.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    新增用户 ({previewData.newUsers.length})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>别名</TableCell>
                          <TableCell>昵称</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.newUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>{user.alias}</TableCell>
                            <TableCell>{user.nickname}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              {previewData.updateUsers.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    更新用户 ({previewData.updateUsers.length})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>别名</TableCell>
                          <TableCell>昵称</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.updateUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>{user.alias}</TableCell>
                            <TableCell>{user.nickname}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
              
              {previewData.unchangedUsers.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
                    无变更用户 ({previewData.unchangedUsers.length})
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>别名</TableCell>
                          <TableCell>昵称</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {previewData.unchangedUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell>{user.alias}</TableCell>
                            <TableCell>{user.nickname}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setImportDialog(false)}>取消</Button>
              <Button
                onClick={handleImport}
                variant="contained"
                disabled={previewData.newUsers.length === 0 && previewData.updateUsers.length === 0}
              >
                确认导入
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Container>
  );
};

export default Admin; 