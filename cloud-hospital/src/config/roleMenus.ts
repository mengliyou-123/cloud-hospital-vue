import type { SidebarMenuItem } from '../components/Sidebar.vue'

export interface HelpSection {
  title: string
  icon: string
  items: string[]
}

export interface RoleHelpConfig {
  roleName: string
  title: string
  description: string
  sections: HelpSection[]
}

export interface SearchActionItem {
  label: string
  desc: string
  path: string
  icon: string
  roles: string[]
  keywords: string[]
}

export const roleHomeMap: Record<string, string> = {
  patient: '/patient/home',
  doctor: '/doctor/home',
  drug_admin: '/drug-admin/home',
  finance_admin: '/finance-admin/home',
  super_admin: '/super-admin/home'
}

export const roleTitleMap: Record<string, string> = {
  patient: '患者端',
  doctor: '医生端',
  drug_admin: '药房端',
  finance_admin: '财务端',
  super_admin: '管理员端'
}

export const roleMenus: Record<string, SidebarMenuItem[]> = {
  patient: [
    { label: '服务中心', icon: 'HomeFilled', path: '/patient/home' },
    { label: '在线挂号', icon: 'Calendar', path: '/patient/register' },
    { label: '挂号记录', icon: 'Notebook', path: '/patient/registers' },
    { label: '就诊记录', icon: 'Document', path: '/patient/treatments' },
    { label: '处方缴费', icon: 'Wallet', path: '/patient/prescriptions' },
    { label: '消息中心', icon: 'Bell', path: '/messages' },
    { label: '个人中心', icon: 'User', path: '/patient/profile' }
  ],
  doctor: [
    { label: '工作台', icon: 'HomeFilled', path: '/doctor/home' },
    { label: '接诊工作台', icon: 'FirstAidKit', path: '/doctor/consultation' },
    { label: '患者档案', icon: 'User', path: '/doctor/patients' },
    { label: '我的排班', icon: 'Calendar', path: '/doctor/schedules' },
    { label: '考勤打卡', icon: 'DataAnalysis', path: '/doctor/attendance' },
    { label: '请假申请', icon: 'EditPen', path: '/doctor/leave' },
    { label: '消息中心', icon: 'Bell', path: '/messages' },
    { label: '个人中心', icon: 'User', path: '/doctor/profile' }
  ],
  drug_admin: [
    { label: '药房工作台', icon: 'HomeFilled', path: '/drug-admin/home' },
    { label: '药品库存', icon: 'Box', path: '/drug-admin/drug-stock' },
    { label: '采购管理', icon: 'Goods', path: '/drug-admin/purchase' },
    { label: '处方配药', icon: 'TakeawayBox', path: '/drug-admin/dispense' },
    { label: '消息中心', icon: 'Bell', path: '/messages' },
    { label: '个人中心', icon: 'User', path: '/drug-admin/profile' }
  ],
  finance_admin: [
    { label: '财务工作台', icon: 'HomeFilled', path: '/finance-admin/home' },
    { label: '收费结算', icon: 'Wallet', path: '/finance-admin/pay-orders' },
    { label: '财务台账', icon: 'DataBoard', path: '/finance-admin/records' },
    { label: '报销管理', icon: 'Document', path: '/finance-admin/reimburses' },
    { label: '统计报表', icon: 'TrendCharts', path: '/finance-admin/reports' },
    { label: '消息中心', icon: 'Bell', path: '/messages' },
    { label: '个人中心', icon: 'User', path: '/finance-admin/profile' }
  ],
  super_admin: [
    { label: '系统总览', icon: 'HomeFilled', path: '/super-admin/home' },
    {
      label: '系统管理',
      icon: 'Setting',
      children: [
        { label: '用户管理', icon: 'Avatar', path: '/super-admin/users' },
        { label: '角色管理', icon: 'Collection', path: '/super-admin/roles' },
        { label: '数据字典', icon: 'Reading', path: '/super-admin/dicts' },
        { label: '操作日志', icon: 'Document', path: '/super-admin/logs' }
      ]
    },
    {
      label: '医院基础数据',
      icon: 'OfficeBuilding',
      children: [
        { label: '科室管理', icon: 'OfficeBuilding', path: '/super-admin/departments' },
        { label: '医护管理', icon: 'UserFilled', path: '/super-admin/doctors' },
        { label: '患者档案', icon: 'User', path: '/super-admin/patients' }
      ]
    },
    {
      label: '排班考勤',
      icon: 'Calendar',
      children: [
        { label: '排班管理', icon: 'Calendar', path: '/super-admin/schedules' },
        { label: '考勤记录', icon: 'DataAnalysis', path: '/super-admin/attendance' },
        { label: '请假审批', icon: 'EditPen', path: '/super-admin/leave-audit' }
      ]
    },
    {
      label: '财务与统计',
      icon: 'Wallet',
      children: [
        { label: '统计报表', icon: 'TrendCharts', path: '/super-admin/reports' },
        { label: '到诊统计', icon: 'DataLine', path: '/super-admin/arrival-statistics' }
      ]
    },
    {
      label: '体验增强',
      icon: 'HelpFilled',
      children: [
        { label: '关怀模式配置', icon: 'HelpFilled', path: '/super-admin/care-mode' },
        { label: '消息中心', icon: 'Bell', path: '/messages' }
      ]
    },
    { label: '个人中心', icon: 'User', path: '/super-admin/profile' }
  ]
}

export const roleHelpConfigs: Record<string, RoleHelpConfig> = {
  patient: {
    roleName: '患者',
    title: '患者端使用说明',
    description: '患者端主要用于在线挂号、查看就诊进度、查询处方缴费和个人资料维护。',
    sections: [
      {
        title: '如何完成挂号',
        icon: 'Calendar',
        items: [
          '进入“在线挂号”，依次选择科室、医生、日期与时段。',
          '确认号源后提交挂号，成功后可在“挂号记录”查看。',
          '未接诊前可取消挂号，已接诊记录不能普通取消。'
        ]
      },
      {
        title: '如何查看就医进度',
        icon: 'Guide',
        items: [
          '进入“挂号记录”，点击“就医进度”。',
          '右侧抽屉会展示挂号、接诊、缴费、取药等步骤。',
          '红色或橙色提示表示当前仍需处理。'
        ]
      },
      {
        title: '关怀模式',
        icon: 'HelpFilled',
        items: [
          '可在顶部打开关怀模式。',
          '关怀模式会放大字号、增强按钮和对比度。',
          '适合长者或视力较弱用户使用。'
        ]
      }
    ]
  },
  doctor: {
    roleName: '医生',
    title: '医生端使用说明',
    description: '医生端用于查看排班、接诊患者、维护诊疗记录和开具处方。',
    sections: [
      {
        title: '接诊流程',
        icon: 'FirstAidKit',
        items: [
          '进入“接诊工作台”查看今日待接诊患者。',
          '开始接诊后填写病情描述、诊断结果和医嘱。',
          '需要用药时可继续开具电子处方。'
        ]
      },
      {
        title: '排班与考勤',
        icon: 'Calendar',
        items: [
          '“我的排班”查看出诊安排。',
          '“考勤打卡”记录出勤。',
          '无法出诊时在“请假申请”提交请假。'
        ]
      }
    ]
  },
  drug_admin: {
    roleName: '药房管理员',
    title: '药房端使用说明',
    description: '药房端用于药品库存、采购入库、处方核对和配药发药。',
    sections: [
      {
        title: '配药发药',
        icon: 'TakeawayBox',
        items: [
          '进入“处方配药”查看待配药处方。',
          '核对患者、药品和缴费状态后确认发药。',
          '库存不足或药品异常时不要强制发药。'
        ]
      },
      {
        title: '库存维护',
        icon: 'Box',
        items: [
          '“药品库存”维护药品信息与库存阈值。',
          '低库存或近效期药品应及时处理。',
          '采购入库后系统会更新库存。'
        ]
      }
    ]
  },
  finance_admin: {
    roleName: '财务管理员',
    title: '财务端使用说明',
    description: '财务端用于缴费确认、财务台账、报销管理和统计报表。',
    sections: [
      {
        title: '缴费结算',
        icon: 'Wallet',
        items: [
          '进入“收费结算”查看待缴费单。',
          '核对患者、处方和金额后确认缴费。',
          '缴费成功后相关处方才能进入配药流程。'
        ]
      },
      {
        title: '台账与报表',
        icon: 'DataBoard',
        items: [
          '“财务台账”查看收支流水。',
          '“统计报表”查看收入趋势和业务分布。'
        ]
      }
    ]
  },
  super_admin: {
    roleName: '系统管理员',
    title: '管理员端使用说明',
    description: '管理员端用于系统基础数据、账号权限、排班考勤、统计分析和体验配置。',
    sections: [
      {
        title: '系统管理',
        icon: 'Setting',
        items: [
          '通过“用户管理”和“角色管理”维护账号权限。',
          '通过“数据字典”维护系统基础选项。',
          '通过“操作日志”追踪关键操作。'
        ]
      },
      {
        title: '运营管理',
        icon: 'DataAnalysis',
        items: [
          '“排班管理”维护医生出诊安排。',
          '“请假审批”和“考勤记录”用于人事管理。',
          '“到诊统计”用于观察预约和爽约情况。'
        ]
      },
      {
        title: '体验增强',
        icon: 'HelpFilled',
        items: [
          '“关怀模式配置”可设置长者友好模式规则。',
          '“消息中心”用于查看系统提醒和业务通知。'
        ]
      }
    ]
  }
}

export const searchActions: SearchActionItem[] = [
  // ======= 患者端 =======
  {
    label: '服务中心',
    desc: '患者首页与功能入口',
    path: '/patient/home',
    icon: 'HomeFilled',
    roles: ['patient'],
    keywords: ['首页', '主页', '服务', '患者']
  },
  {
    label: '在线挂号',
    desc: '选择科室、医生与就诊时段',
    path: '/patient/register',
    icon: 'Calendar',
    roles: ['patient'],
    keywords: ['挂号', '预约', '科室', '医生', '看病', '就诊']
  },
  {
    label: '挂号记录',
    desc: '查看预约、取消挂号、查看就医进度',
    path: '/patient/registers',
    icon: 'Notebook',
    roles: ['patient'],
    keywords: ['记录', '进度', '取消', '预约', '历史']
  },
  {
    label: '就诊记录',
    desc: '查看历史就诊、诊断和医嘱信息',
    path: '/patient/treatments',
    icon: 'Document',
    roles: ['patient'],
    keywords: ['就诊', '诊断', '医嘱', '看病记录', '病历']
  },
  {
    label: '处方缴费',
    desc: '查看处方和待缴费单、在线支付',
    path: '/patient/prescriptions',
    icon: 'Wallet',
    roles: ['patient'],
    keywords: ['处方', '缴费', '支付', '药品费用', '账单']
  },
  {
    label: '消息中心',
    desc: '查看系统提醒和业务通知',
    path: '/messages',
    icon: 'Bell',
    roles: ['patient', 'doctor', 'drug_admin', 'finance_admin', 'super_admin'],
    keywords: ['消息', '通知', '提醒', '公告']
  },
  {
    label: '患者个人中心',
    desc: '查看和编辑个人资料、关怀模式设置',
    path: '/patient/profile',
    icon: 'User',
    roles: ['patient'],
    keywords: ['个人', '资料', '设置', '我的']
  },

  // ======= 医生端 =======
  {
    label: '工作台',
    desc: '医生工作台首页',
    path: '/doctor/home',
    icon: 'HomeFilled',
    roles: ['doctor'],
    keywords: ['首页', '工作台', '医生主页']
  },
  {
    label: '接诊工作台',
    desc: '查看待接诊患者并填写诊疗记录',
    path: '/doctor/consultation',
    icon: 'FirstAidKit',
    roles: ['doctor'],
    keywords: ['接诊', '诊疗', '处方', '诊断', '看病']
  },
  {
    label: '患者档案',
    desc: '查看患者就诊记录和个人信息',
    path: '/doctor/patients',
    icon: 'User',
    roles: ['doctor'],
    keywords: ['患者', '档案', '病历', '就诊记录']
  },
  {
    label: '我的排班',
    desc: '查看医生个人出诊排班',
    path: '/doctor/schedules',
    icon: 'Calendar',
    roles: ['doctor'],
    keywords: ['排班', '出诊', '日程', '值班']
  },
  {
    label: '考勤打卡',
    desc: '记录出勤时间和打卡状态',
    path: '/doctor/attendance',
    icon: 'DataAnalysis',
    roles: ['doctor'],
    keywords: ['考勤', '打卡', '出勤', '工时']
  },
  {
    label: '请假申请',
    desc: '提交和查看请假申请',
    path: '/doctor/leave',
    icon: 'EditPen',
    roles: ['doctor'],
    keywords: ['请假', '休假', '申请', '调休']
  },
  {
    label: '医生个人中心',
    desc: '查看和编辑医生个人资料',
    path: '/doctor/profile',
    icon: 'User',
    roles: ['doctor'],
    keywords: ['个人', '资料', '设置', '我的']
  },

  // ======= 药房端 =======
  {
    label: '药房工作台',
    desc: '药房管理首页',
    path: '/drug-admin/home',
    icon: 'HomeFilled',
    roles: ['drug_admin'],
    keywords: ['首页', '药房', '工作台']
  },
  {
    label: '药品库存',
    desc: '维护药品信息、库存数量和预警阈值',
    path: '/drug-admin/drug-stock',
    icon: 'Box',
    roles: ['drug_admin', 'super_admin'],
    keywords: ['药品', '库存', '预警', '药物', '存货']
  },
  {
    label: '采购管理',
    desc: '药品采购入库与供应商管理',
    path: '/drug-admin/purchase',
    icon: 'Goods',
    roles: ['drug_admin'],
    keywords: ['采购', '入库', '供应商', '进货']
  },
  {
    label: '处方配药',
    desc: '核对已缴费处方并完成配药发药',
    path: '/drug-admin/dispense',
    icon: 'TakeawayBox',
    roles: ['drug_admin'],
    keywords: ['配药', '发药', '处方', '取药']
  },
  {
    label: '药房个人中心',
    desc: '查看和编辑药房管理员资料',
    path: '/drug-admin/profile',
    icon: 'User',
    roles: ['drug_admin'],
    keywords: ['个人', '资料', '设置', '我的']
  },

  // ======= 财务端 =======
  {
    label: '财务工作台',
    desc: '财务统计首页',
    path: '/finance-admin/home',
    icon: 'HomeFilled',
    roles: ['finance_admin'],
    keywords: ['首页', '财务', '工作台']
  },
  {
    label: '收费结算',
    desc: '确认患者缴费和费用状态',
    path: '/finance-admin/pay-orders',
    icon: 'Wallet',
    roles: ['finance_admin'],
    keywords: ['缴费', '收费', '结算', '支付', '账单']
  },
  {
    label: '财务台账',
    desc: '查看收支明细和历史账单',
    path: '/finance-admin/records',
    icon: 'DataBoard',
    roles: ['finance_admin'],
    keywords: ['台账', '收支', '账目', '明细', '流水']
  },
  {
    label: '报销管理',
    desc: '处理患者医保和费用报销申请',
    path: '/finance-admin/reimburses',
    icon: 'Document',
    roles: ['finance_admin'],
    keywords: ['报销', '医保', '费用']
  },
  {
    label: '统计报表',
    desc: '查看收入趋势和业务数据报表',
    path: '/finance-admin/reports',
    icon: 'TrendCharts',
    roles: ['finance_admin', 'super_admin'],
    keywords: ['统计', '报表', '收入', '趋势', '数据']
  },
  {
    label: '财务个人中心',
    desc: '查看和编辑财务管理员资料',
    path: '/finance-admin/profile',
    icon: 'User',
    roles: ['finance_admin'],
    keywords: ['个人', '资料', '设置', '我的']
  },

  // ======= 管理员端 =======
  {
    label: '系统总览',
    desc: '管理员首页与系统状态概览',
    path: '/super-admin/home',
    icon: 'HomeFilled',
    roles: ['super_admin'],
    keywords: ['首页', '总览', '概览', '系统', '管理员']
  },
  {
    label: '用户管理',
    desc: '维护系统用户账号与状态',
    path: '/super-admin/users',
    icon: 'Avatar',
    roles: ['super_admin'],
    keywords: ['用户', '账号', '人员', '账户']
  },
  {
    label: '角色管理',
    desc: '配置用户角色和权限范围',
    path: '/super-admin/roles',
    icon: 'Collection',
    roles: ['super_admin'],
    keywords: ['角色', '权限', '管理', '配置']
  },
  {
    label: '数据字典',
    desc: '维护系统基础数据和选项值',
    path: '/super-admin/dicts',
    icon: 'Reading',
    roles: ['super_admin'],
    keywords: ['字典', '基础数据', '配置', '选项', '编码']
  },
  {
    label: '操作日志',
    desc: '追踪系统关键操作和变更记录',
    path: '/super-admin/logs',
    icon: 'Document',
    roles: ['super_admin'],
    keywords: ['日志', '操作', '记录', '审计', '跟踪']
  },
  {
    label: '科室管理',
    desc: '维护医院科室信息和层级',
    path: '/super-admin/departments',
    icon: 'OfficeBuilding',
    roles: ['super_admin'],
    keywords: ['科室', '部门', '管理', '医院基础数据']
  },
  {
    label: '医护管理',
    desc: '管理医生和医护人员信息',
    path: '/super-admin/doctors',
    icon: 'UserFilled',
    roles: ['super_admin'],
    keywords: ['医生', '医护', '人员', '职员']
  },
  {
    label: '患者档案管理',
    desc: '查看和管理全院患者档案',
    path: '/super-admin/patients',
    icon: 'User',
    roles: ['super_admin'],
    keywords: ['患者', '档案', '病历']
  },
  {
    label: '排班管理',
    desc: '维护医生出诊排班安排',
    path: '/super-admin/schedules',
    icon: 'Calendar',
    roles: ['super_admin'],
    keywords: ['排班', '医生', '出诊', '安排']
  },
  {
    label: '考勤记录',
    desc: '查看全院出勤打卡记录',
    path: '/super-admin/attendance',
    icon: 'DataAnalysis',
    roles: ['super_admin'],
    keywords: ['考勤', '打卡', '出勤', '工时', '记录']
  },
  {
    label: '请假审批',
    desc: '审批医护人员请假申请',
    path: '/super-admin/leave-audit',
    icon: 'EditPen',
    roles: ['super_admin'],
    keywords: ['请假', '审批', '休假', '审核']
  },
  {
    label: '到诊统计',
    desc: '查看预约挂号和到诊爽约情况分析',
    path: '/super-admin/arrival-statistics',
    icon: 'DataLine',
    roles: ['super_admin'],
    keywords: ['到诊', '统计', '挂号', '预约', '爽约', '分析']
  },
  {
    label: '关怀模式配置',
    desc: '设置长者友好模式和字号对比度',
    path: '/super-admin/care-mode',
    icon: 'HelpFilled',
    roles: ['super_admin'],
    keywords: ['关怀', '长者', '老年', '配置', '字号', '大字体']
  },
  {
    label: '管理员个人中心',
    desc: '查看和编辑系统管理员资料',
    path: '/super-admin/profile',
    icon: 'User',
    roles: ['super_admin'],
    keywords: ['个人', '资料', '设置', '我的']
  }
]

export function getRoleMenu(roleCode?: string): SidebarMenuItem[] {
  if (!roleCode) return []
  return roleMenus[roleCode] || []
}

export function getRoleHelp(roleCode?: string): RoleHelpConfig {
  return roleHelpConfigs[roleCode || ''] || roleHelpConfigs.patient
}

export function getRoleTitle(roleCode?: string): string {
  return roleTitleMap[roleCode || ''] || '云医院 HIS'
}

export function getHomePath(roleCode?: string): string {
  return roleHomeMap[roleCode || ''] || '/login'
}