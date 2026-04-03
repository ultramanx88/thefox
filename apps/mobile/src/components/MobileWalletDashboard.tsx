import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Button, Card, Loading } from '@repo/ui/shared-components';
import { DesignTokens } from '@repo/ui/design-tokens';

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus';
  amount: number;
  description: string;
  date: Date;
  status: 'completed' | 'pending';
}

export const MobileWalletDashboard: React.FC = () => {
  const [balance] = useState(2450.75);
  const [totalEarnings] = useState(15680.50);
  const [pendingWithdrawals] = useState(500.00);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'earning',
      amount: 85.50,
      description: 'Order #ORD-2024-001 delivery',
      date: new Date('2024-01-15T14:30:00'),
      status: 'completed'
    },
    {
      id: '2',
      type: 'bonus',
      amount: 50.00,
      description: 'Peak hour bonus',
      date: new Date('2024-01-15T12:00:00'),
      status: 'completed'
    },
    {
      id: '3',
      type: 'withdrawal',
      amount: -1000.00,
      description: 'Withdrawal to Bangkok Bank ***1234',
      date: new Date('2024-01-14T10:15:00'),
      status: 'completed'
    }
  ]);

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    const MIN_WITHDRAWAL = 100;
    
    if (amount < MIN_WITHDRAWAL) {
      Alert.alert('ข้อผิดพลาด', `จำนวนเงินขั้นต่ำในการถอน ${MIN_WITHDRAWAL} บาท`);
      return;
    }
    
    if (amount > balance) {
      Alert.alert('ข้อผิดพลาด', 'ยอดเงินไม่เพียงพอ');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      Alert.alert('สำเร็จ', 'คำขอถอนเงินถูกส่งแล้ว');
    }, 2000);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earning': return '💰';
      case 'bonus': return '🎁';
      case 'withdrawal': return '🏦';
      default: return '💳';
    }
  };

  if (loading) {
    return <Loading size="lg" />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>กระเป๋าเงินคนขับ</Text>
        <Text style={styles.subtitle}>จัดการเงินรายได้และการถอนเงิน</Text>
      </View>

      {/* Balance Cards */}
      <View style={styles.balanceGrid}>
        <Card style={[styles.balanceCard, styles.primaryCard]}>
          <Text style={styles.balanceLabel}>ยอดเงินคงเหลือ</Text>
          <Text style={styles.balanceAmount}>฿{balance.toLocaleString()}</Text>
          <Text style={styles.balanceIcon}>💰</Text>
        </Card>

        <Card style={[styles.balanceCard, styles.successCard]}>
          <Text style={styles.balanceLabel}>รายได้วันนี้</Text>
          <Text style={styles.balanceAmount}>฿285</Text>
          <Text style={styles.balanceIcon}>📈</Text>
        </Card>

        <Card style={[styles.balanceCard, styles.warningCard]}>
          <Text style={styles.balanceLabel}>รายได้รวม</Text>
          <Text style={styles.balanceAmount}>฿{totalEarnings.toLocaleString()}</Text>
          <Text style={styles.balanceIcon}>🏆</Text>
        </Card>

        <Card style={[styles.balanceCard, styles.infoCard]}>
          <Text style={styles.balanceLabel}>รอถอน</Text>
          <Text style={styles.balanceAmount}>฿{pendingWithdrawals.toLocaleString()}</Text>
          <Text style={styles.balanceIcon}>⏳</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>การดำเนินการด่วน</Text>
        <View style={styles.actionsGrid}>
          <Button
            title="ถอนเงิน"
            onPress={() => setShowWithdrawModal(true)}
            variant="primary"
          />
          <Button
            title="รายงานรายได้"
            onPress={() => {}}
            variant="outline"
          />
        </View>
      </Card>

      {/* Recent Transactions */}
      <Card style={styles.transactionsCard}>
        <Text style={styles.sectionTitle}>ธุรกรรมล่าสุด</Text>
        {transactions.slice(0, 5).map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <Text style={styles.transactionIcon}>
                {getTransactionIcon(transaction.type)}
              </Text>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDescription}>
                  {transaction.description}
                </Text>
                <Text style={styles.transactionDate}>
                  {transaction.date.toLocaleDateString('th-TH')}
                </Text>
              </View>
            </View>
            <View style={styles.transactionRight}>
              <Text style={[
                styles.transactionAmount,
                transaction.amount >= 0 ? styles.positiveAmount : styles.negativeAmount
              ]}>
                {transaction.amount >= 0 ? '+' : ''}฿{Math.abs(transaction.amount).toLocaleString()}
              </Text>
              <Text style={styles.transactionStatus}>
                {transaction.status === 'completed' ? 'สำเร็จ' : 'รอดำเนินการ'}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Withdrawal Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ถอนเงิน</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>จำนวนเงิน</Text>
              <TextInput
                style={styles.input}
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="0.00"
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                ยอดคงเหลือ: ฿{balance.toLocaleString()} | ขั้นต่ำ: ฿100
              </Text>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="ยกเลิก"
                onPress={() => setShowWithdrawModal(false)}
                variant="outline"
              />
              <Button
                title="ถอนเงิน"
                onPress={handleWithdraw}
                variant="primary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.gray[50],
  },
  header: {
    padding: DesignTokens.spacing.lg,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: DesignTokens.typography.sizes['2xl'],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.gray[900],
    marginBottom: DesignTokens.spacing.xs,
  },
  subtitle: {
    fontSize: DesignTokens.typography.sizes.base,
    color: DesignTokens.colors.gray[600],
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  balanceCard: {
    width: '47%',
    position: 'relative',
    minHeight: 100,
  },
  primaryCard: {
    backgroundColor: DesignTokens.colors.primary[600],
  },
  successCard: {
    backgroundColor: DesignTokens.colors.success,
  },
  warningCard: {
    backgroundColor: DesignTokens.colors.warning,
  },
  infoCard: {
    backgroundColor: '#8b5cf6',
  },
  balanceLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: DesignTokens.spacing.xs,
  },
  balanceAmount: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: '#ffffff',
  },
  balanceIcon: {
    position: 'absolute',
    top: DesignTokens.spacing.md,
    right: DesignTokens.spacing.md,
    fontSize: 24,
  },
  actionsCard: {
    margin: DesignTokens.spacing.md,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.gray[900],
    marginBottom: DesignTokens.spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  transactionsCard: {
    margin: DesignTokens.spacing.md,
    marginTop: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.gray[100],
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 24,
    marginRight: DesignTokens.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: DesignTokens.typography.sizes.base,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[900],
  },
  transactionDate: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: DesignTokens.typography.sizes.base,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  positiveAmount: {
    color: DesignTokens.colors.success,
  },
  negativeAmount: {
    color: DesignTokens.colors.error,
  },
  transactionStatus: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.gray[500],
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.gray[900],
    marginBottom: DesignTokens.spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: DesignTokens.spacing.lg,
  },
  inputLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[700],
    marginBottom: DesignTokens.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.gray[200],
    borderRadius: DesignTokens.borderRadius.md,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.sizes.base,
  },
  inputHint: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.gray[600],
    marginTop: DesignTokens.spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
});