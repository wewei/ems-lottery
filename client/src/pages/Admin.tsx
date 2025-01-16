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
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
      const response = await axios.get('/api/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('获取用户列表失败', err);
    }
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
            <Box sx={{ mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setAddUserDialog(true)}
              >
                添加用户
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>别名</TableCell>
                    <TableCell>昵称</TableCell>
                    <TableCell align="center">状态</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
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
        </Paper>
      </Box>
    </Container>
  );
};

export default Admin; 