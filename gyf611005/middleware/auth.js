/**
 * 认证中间件
 * 检查用户登录状态和权限
 */
export default function(context) {
  var user = context.store.getters['user/currentUser']
  var path = context.route.path
  
  if (path === '/login') {
    if (user) {
      return context.redirect('/')
    }
    return
  }
  
  if (!user) {
    return context.redirect('/login')
  }
  
  var hasPermission = context.store.getters['user/hasPermission']
  
  if (path.startsWith('/review') && !hasPermission('review')) {
    context.$message.error('您没有复核权限')
    return context.redirect('/')
  }
  
  if (path.startsWith('/seal') && !hasPermission('seal')) {
    context.$message.error('您没有封存审批权限')
    return context.redirect('/')
  }
  
  if (path.startsWith('/history/export') && !hasPermission('export')) {
    context.$message.error('您没有导出权限')
    return context.redirect('/')
  }
}
