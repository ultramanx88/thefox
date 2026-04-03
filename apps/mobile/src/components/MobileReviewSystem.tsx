import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image
} from 'react-native';
import { Button, Card, Rating } from '@repo/ui/shared-components';
import { DesignTokens } from '@repo/ui/design-tokens';

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: Date;
  helpful: number;
}

export const MobileReviewSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('list');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [reviews] = useState<Review[]>([
    {
      id: '1',
      userName: 'สมชาย ใจดี',
      userAvatar: '/avatars/user1.jpg',
      rating: 5,
      comment: 'อาหารอร่อยมาก บริการดีเยี่ยม จัดส่งรวดเร็ว',
      date: new Date('2024-01-15T19:30:00'),
      helpful: 12
    },
    {
      id: '2',
      userName: 'สมหญิง รักดี',
      rating: 4,
      comment: 'คนขับสุภาพ ส่งตรงเวลา อาหารยังร้อนอยู่',
      date: new Date('2024-01-14T18:15:00'),
      helpful: 8
    },
    {
      id: '3',
      userName: 'สมศักดิ์ ดีใจ',
      rating: 5,
      comment: 'ประทับใจมาก จะสั่งอีกแน่นอน',
      date: new Date('2024-01-13T20:00:00'),
      helpful: 15
    }
  ]);

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  const handleSubmitReview = () => {
    if (rating === 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาให้คะแนน');
      return;
    }
    
    if (comment.trim().length < 10) {
      Alert.alert('ข้อผิดพลาด', 'กรุณาเขียนรีวิวอย่างน้อย 10 ตัวอักษร');
      return;
    }

    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setRating(0);
      setComment('');
      setActiveTab('list');
      Alert.alert('สำเร็จ', 'รีวิวถูกส่งเรียบร้อยแล้ว');
    }, 2000);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'เมื่อสักครู่';
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>รีวิวและคะแนน</Text>
        <Text style={styles.subtitle}>แบ่งปันประสบการณ์ของคุณ</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
            รีวิวทั้งหมด
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'write' && styles.activeTab]}
          onPress={() => setActiveTab('write')}
        >
          <Text style={[styles.tabText, activeTab === 'write' && styles.activeTabText]}>
            เขียนรีวิว
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'list' ? (
          <>
            {/* Rating Summary */}
            <Card style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <View style={styles.ratingSection}>
                  <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                  <Rating rating={averageRating} size="lg" showNumber={false} />
                  <Text style={styles.reviewCount}>{reviews.length} รีวิว</Text>
                </View>
              </View>
            </Card>

            {/* Reviews List */}
            <View style={styles.reviewsList}>
              {reviews.map((review) => (
                <Card key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatar}>
                        {review.userAvatar ? (
                          <Image source={{ uri: review.userAvatar }} style={styles.avatarImage} />
                        ) : (
                          <Text style={styles.avatarText}>👤</Text>
                        )}
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{review.userName}</Text>
                        <View style={styles.ratingRow}>
                          <Rating rating={review.rating} size="sm" showNumber={false} />
                          <Text style={styles.reviewDate}>{formatTimeAgo(review.date)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  
                  <View style={styles.reviewActions}>
                    <TouchableOpacity style={styles.helpfulButton}>
                      <Text style={styles.helpfulText}>👍 มีประโยชน์ ({review.helpful})</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          </>
        ) : (
          /* Write Review Form */
          <Card style={styles.writeReviewCard}>
            <Text style={styles.formTitle}>เขียนรีวิว</Text>
            
            {/* Rating Input */}
            <View style={styles.ratingInput}>
              <Text style={styles.inputLabel}>ให้คะแนน</Text>
              <View style={styles.starsInput}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                  >
                    <Text style={[
                      styles.starButton,
                      star <= rating ? styles.starSelected : styles.starUnselected
                    ]}>
                      ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {rating} ดาว - {
                    rating === 5 ? 'ยอดเยี่ยม' :
                    rating === 4 ? 'ดีมาก' :
                    rating === 3 ? 'ดี' :
                    rating === 2 ? 'พอใช้' : 'ต้องปรับปรุง'
                  }
                </Text>
              )}
            </View>

            {/* Comment Input */}
            <View style={styles.commentInput}>
              <Text style={styles.inputLabel}>ความคิดเห็น</Text>
              <TextInput
                style={styles.commentTextInput}
                value={comment}
                onChangeText={setComment}
                placeholder="แบ่งปันประสบการณ์ของคุณ..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {comment.length}/500 ตัวอักษร (ขั้นต่ำ 10 ตัวอักษร)
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              title={submitting ? 'กำลังส่งรีวิว...' : 'ส่งรีวิว'}
              onPress={handleSubmitReview}
              disabled={submitting || rating === 0 || comment.trim().length < 10}
            />
          </Card>
        )}
      </ScrollView>
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: DesignTokens.colors.primary[600],
  },
  tabText: {
    fontSize: DesignTokens.typography.sizes.base,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[500],
  },
  activeTabText: {
    color: DesignTokens.colors.primary[600],
  },
  content: {
    flex: 1,
    padding: DesignTokens.spacing.md,
  },
  summaryCard: {
    marginBottom: DesignTokens.spacing.md,
  },
  summaryContent: {
    alignItems: 'center',
  },
  ratingSection: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: DesignTokens.typography.sizes['3xl'],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.gray[900],
    marginBottom: DesignTokens.spacing.sm,
  },
  reviewCount: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
    marginTop: DesignTokens.spacing.sm,
  },
  reviewsList: {
    gap: DesignTokens.spacing.md,
  },
  reviewCard: {
    marginBottom: DesignTokens.spacing.md,
  },
  reviewHeader: {
    marginBottom: DesignTokens.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignTokens.colors.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: DesignTokens.typography.sizes.base,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[900],
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
  },
  reviewComment: {
    fontSize: DesignTokens.typography.sizes.base,
    color: DesignTokens.colors.gray[700],
    lineHeight: 24,
    marginBottom: DesignTokens.spacing.md,
  },
  reviewActions: {
    flexDirection: 'row',
  },
  helpfulButton: {
    paddingVertical: DesignTokens.spacing.sm,
  },
  helpfulText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
  },
  writeReviewCard: {
    marginBottom: DesignTokens.spacing.md,
  },
  formTitle: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.gray[900],
    marginBottom: DesignTokens.spacing.lg,
  },
  ratingInput: {
    marginBottom: DesignTokens.spacing.lg,
  },
  inputLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.gray[700],
    marginBottom: DesignTokens.spacing.sm,
  },
  starsInput: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    marginBottom: DesignTokens.spacing.sm,
  },
  starButton: {
    fontSize: 32,
  },
  starSelected: {
    color: '#fbbf24',
  },
  starUnselected: {
    color: DesignTokens.colors.gray[300],
  },
  ratingLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.gray[600],
  },
  commentInput: {
    marginBottom: DesignTokens.spacing.lg,
  },
  commentTextInput: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.gray[200],
    borderRadius: DesignTokens.borderRadius.md,
    padding: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.sizes.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.gray[500],
    marginTop: DesignTokens.spacing.xs,
    textAlign: 'right',
  },
});