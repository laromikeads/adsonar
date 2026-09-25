import { MetaAd, SearchParams, SearchResult } from '@/types';
import { scoreAd } from '@/lib/analysis/scorer';

const META_AD_LIBRARY_BASE = 'https://graph.facebook.com/v21.0/ads_archive';

const AD_FIELDS = [
  'id',
  'page_id',
  'page_name',
  'ad_creative_bodies',
  'ad_creative_link_captions',
  'ad_creative_link_descriptions',
  'ad_creative_link_titles',
  'ad_delivery_start_time',
  'ad_delivery_stop_time',
  'ad_snapshot_url',
  'currency',
  'demographic_distribution',
  'delivery_by_region',
  'estimated_audience_size',
  'impressions',
  'spend',
  'languages',
  'publisher_platforms',
].join(',');

const ECOM_SIGNALS = [
  'buy', 'shop', 'order', 'shipping', 'delivery', 'store', 'product',
  'price', 'offer', 'deal', 'discount', 'sale', 'stock', 'available',
  'checkout', 'cart', 'purchase', 'limited', 'bundle', 'pack', 'kit',
  'acheter', 'achetez', 'commandez', 'livraison', 'boutique', 'produit',
  'prix', 'offre', 'promo', 'réduction', 'soldes', 'disponible', 'stock',
  'panier', 'commander', 'expédition', 'gratuit', 'qualité', 'collection',
  'اشتري', 'اطلب', 'توصيل', 'متجر', 'منتج', 'سعر', 'عرض', 'تخفيض',
  'مخزون', 'متوفر', 'جودة', 'مجاني',
];

const NON_ECOM_SIGNALS = [
  'episode', 'série', 'saison', 'regarder', 'watch', 'streaming', 'doublage',
  'film', 'movie', 'drama', 'roman', 'feuilleton', 'télé',
  'fiction', 'romance', 'novel', 'thriller', 'fantasy', 'manga', 'comic',
  'dark romance', 'love story', 'chapitre', 'chapter', 'lecture',
  'rencontre', 'célibataire', 'dating', 'mariage', 'amor',
  'élection', 'politique', 'gouvernement',
