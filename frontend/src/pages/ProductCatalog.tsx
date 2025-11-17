import React, { useState } from 'react';
import { PlusCircleIcon, ArrowDownTrayIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import PopularProductsSection from '../components/products/PopularProductsSection';
import FiltersBar from '../components/products/FiltersBar';
import ProductGrid from '../components/products/ProductGrid';
import Pagination from '../components/products/Pagination';
import ProductDetailModal from '../components/products/ProductDetailModal';
import AddProductModal from '../components/products/AddProductModal';
import EditProductModal from '../components/products/EditProductModal';
import ManageInventoryModal from '../components/products/ManageInventoryModal';
import BulkPriceUpdateModal from '../components/products/BulkPriceUpdateModal';
import InstallmentWizard from '../components/installments/InstallmentWizard';
import Toast from '../components/common/Toast';
import { useProductCatalog, usePopularProducts } from '../hooks/useProductCatalog';
import type { ProductFilters, Product } from '../types/product';
import { useToast } from '../hooks/useToast';

// Product categories for female wear and accessories retail store
const PRODUCT_CATEGORIES = [
  'طُرَح',
  'اكسسوارات',
  'بيجامات',
  'ميكاب "مكياج"',
  'لانجيري',
  'مكملات حجاب',
  'أطفالي',
];

/**
 * ProductCatalogPage Component
 * Main page for browsing and managing products
 * Requirements: 1.1-1.9, 2.1-2.9, 4.1-4.8
 */
const ProductCatalog: React.FC = () => {
  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 20, // Requirement: Pagination (20 per page)
  });

  // Modal state
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryProduct, setInventoryProduct] = useState<Product | null>(null);

  // Bulk selection state - Requirement 14.1, 14.2
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [isBulkPriceUpdateModalOpen, setIsBulkPriceUpdateModalOpen] = useState(false);

  // Installment wizard state - Requirement 4.1-4.8
  const [isInstallmentWizardOpen, setIsInstallmentWizardOpen] = useState(false);
  const [preSelectedProductId, setPreSelectedProductId] = useState<number | null>(null);

  // Toast notifications - Requirements: 6.9, 8.9, 10.9
  const { toast, showSuccess, showError, hideToast } = useToast();

  // Fetch data
  const { data: catalogData, isLoading: catalogLoading } = useProductCatalog(filters);
  const { data: popularProducts = [], isLoading: popularLoading } = usePopularProducts(5);
  const categories = PRODUCT_CATEGORIES;

  /**
   * Listen for custom event to open product detail from related products
   */
  React.useEffect(() => {
    const handleOpenProductDetail = (event: CustomEvent) => {
      const { productId } = event.detail;
      setSelectedProductId(productId);
      setIsDetailModalOpen(true);
    };

    window.addEventListener('openProductDetail', handleOpenProductDetail as EventListener);

    return () => {
      window.removeEventListener('openProductDetail', handleOpenProductDetail as EventListener);
    };
  }, []);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters);
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Handle product click - open product detail modal
   */
  const handleProductClick = (productId: number) => {
    setSelectedProductId(productId);
    setIsDetailModalOpen(true);
  };

  /**
   * Handle quick add to installment - Requirement 4.1-4.8
   * Opens installment wizard with pre-selected product
   */
  const handleQuickAdd = (productId: number) => {
    setPreSelectedProductId(productId);
    setIsInstallmentWizardOpen(true);
  };

  /**
   * Handle add to installment from modal - Requirement 4.1-4.8
   * Closes detail modal and opens wizard with pre-selected product
   */
  const handleAddToInstallment = (productId: number) => {
    setIsDetailModalOpen(false);
    handleQuickAdd(productId);
  };

  /**
   * Handle installment wizard close - Requirement 4.6
   * Allows returning to catalog
   */
  const handleInstallmentWizardClose = () => {
    setIsInstallmentWizardOpen(false);
    setPreSelectedProductId(null);
  };

  /**
   * Handle installment wizard success - Requirement 4.7, 4.8
   * Shows success message and updates product installment count
   */
  const handleInstallmentWizardSuccess = (message: string) => {
    showSuccess(message);
    setIsInstallmentWizardOpen(false);
    setPreSelectedProductId(null);
    // Refresh catalog to update installment counts
    // The useProductCatalog hook will automatically refetch when filters change
    setFilters({ ...filters });
  };

  /**
   * Handle installment wizard error
   */
  const handleInstallmentWizardError = (message: string) => {
    showError(message);
  };

  /**
   * Handle edit product - Requirement 7.1
   */
  const handleEditProduct = (productId: number) => {
    setEditProductId(productId);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false); // Close detail modal when opening edit
  };

  /**
   * Handle manage inventory - Requirement 8.1-8.9
   */
  const handleManageInventory = (productId: number) => {
    // Find the product from catalog data
    const product = catalogData?.products.find((p) => p.id === productId);
    if (product) {
      setInventoryProduct(product);
      setIsInventoryModalOpen(true);
      setIsDetailModalOpen(false); // Close detail modal when opening inventory
    }
  };

  /**
   * Handle toggle product status (activate/deactivate)
   */
  const handleToggleStatus = async (productId: number) => {
    try {
      const product = catalogData?.products.find((p) => p.id === productId);
      if (!product) return;

      const action = product.status === 'ACTIVE' ? 'deactivate' : 'activate';
      
      // Call the appropriate service method
      if (action === 'deactivate') {
        await productService.deactivateProduct(productId, 'تم إيقاف المنتج من قبل المستخدم');
      } else {
        await productService.activateProduct(productId);
      }

      showSuccess(
        product.status === 'ACTIVE' ? 'تم إيقاف المنتج بنجاح' : 'تم تفعيل المنتج بنجاح'
      );

      // Refresh catalog
      setFilters({ ...filters });
    } catch (error) {
      showError('فشل في تغيير حالة المنتج');
      console.error('Toggle status error:', error);
    }
  };;

  /**
   * Handle add product
   */
  const handleAddProduct = () => {
    setIsAddModalOpen(true);
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    // TODO: Implement export modal
    console.log('Export clicked');
  };

  /**
   * Toggle bulk selection mode
   */
  const handleToggleBulkMode = () => {
    setBulkSelectionMode(!bulkSelectionMode);
    setSelectedProductIds(new Set()); // Clear selection when toggling
  };

  /**
   * Handle product selection
   */
  const handleProductSelect = (productId: number) => {
    const newSelection = new Set(selectedProductIds);
    if (newSelection.has(productId)) {
      newSelection.delete(productId);
    } else {
      newSelection.add(productId);
    }
    setSelectedProductIds(newSelection);
  };

  /**
   * Handle select all products
   */
  const handleSelectAll = () => {
    if (catalogData?.products) {
      const allIds = catalogData.products.map((p) => p.id);
      setSelectedProductIds(new Set(allIds));
    }
  };

  /**
   * Handle clear selection
   */
  const handleClearSelection = () => {
    setSelectedProductIds(new Set());
  };

  /**
   * Handle bulk price update
   */
  const handleBulkPriceUpdate = () => {
    if (selectedProductIds.size === 0) {
      showError('يرجى اختيار منتجات للتحديث');
      return;
    }
    setIsBulkPriceUpdateModalOpen(true);
  };

  /**
   * Get selected products
   */
  const getSelectedProducts = (): Product[] => {
    if (!catalogData?.products) return [];
    return catalogData.products.filter((p) => selectedProductIds.has(p.id));
  };

  return (
    <DashboardLayout title="كتالوج المنتجات">
      {/* Page Header with Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Add Product Button - All roles can add products */}
          <button
            type="button"
            onClick={handleAddProduct}
            className="flex items-center gap-2 px-6 py-3 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-bold rounded-lg shadow-lg transition-colors duration-300"
          >
            <PlusCircleIcon className="w-5 h-5" />
            <span>إضافة منتج جديد</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-brand-offwhite-100 text-brand-primary-900 font-bold rounded-lg shadow-lg border border-brand-offwhite-400 transition-colors duration-300"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>تصدير</span>
          </button>

          {/* Bulk Selection Toggle */}
          <button
            type="button"
            onClick={handleToggleBulkMode}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg shadow-lg border transition-colors duration-300 ${
              bulkSelectionMode
                ? 'bg-brand-secondary-400 hover:bg-brand-secondary-500 text-brand-primary-900 border-brand-secondary-400'
                : 'bg-white hover:bg-brand-offwhite-100 text-brand-primary-900 border-brand-offwhite-400'
            }`}
          >
            <span>{bulkSelectionMode ? 'إلغاء التحديد' : 'تحديد متعدد'}</span>
          </button>
        </div>

        {/* Products Count */}
        {catalogData && (
          <div className="text-sm text-brand-offwhite-700">
            عرض {catalogData.products.length} من {catalogData.pagination.totalCount} منتج
          </div>
        )}
      </div>

      {/* Bulk Actions Toolbar - Requirement 14.1, 14.2 */}
      {bulkSelectionMode && (
        <div className="mb-6 p-4 bg-brand-secondary-50 border border-brand-secondary-400 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-brand-primary-900 font-bold">
                {selectedProductIds.size} منتج محدد
              </span>
              {catalogData && catalogData.products.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-brand-primary-900 hover:text-brand-primary-950 font-medium underline"
                  >
                    تحديد الكل
                  </button>
                  {selectedProductIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-sm text-brand-primary-700 hover:text-brand-primary-900 font-medium underline"
                    >
                      مسح التحديد
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Bulk Price Update Button */}
              <button
                type="button"
                onClick={handleBulkPriceUpdate}
                disabled={selectedProductIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary-900 hover:bg-brand-primary-950 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CurrencyDollarIcon className="w-5 h-5" />
                <span>تحديث الأسعار</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popular Products Section - Requirement 5.1-5.8 */}
      <PopularProductsSection
        products={popularProducts}
        onProductClick={handleProductClick}
        loading={popularLoading}
      />

      {/* Filters Bar - Requirement 2.1-2.9 */}
      <FiltersBar filters={filters} onFiltersChange={handleFiltersChange} categories={categories} />

      {/* Product Grid - Requirement 1.1-1.9 */}
      <ProductGrid
        products={catalogData?.products || []}
        loading={catalogLoading}
        onProductClick={handleProductClick}
        onQuickAdd={handleQuickAdd}
        onEdit={handleEditProduct}
        onManageInventory={handleManageInventory}
        onToggleStatus={handleToggleStatus}
        bulkSelectionMode={bulkSelectionMode}
        selectedProductIds={selectedProductIds}
        onProductSelect={handleProductSelect}
      />

      {/* Pagination */}
      {catalogData && catalogData.pagination.totalPages > 1 && (
        <Pagination
          currentPage={catalogData.pagination.page}
          totalPages={catalogData.pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Product Detail Modal - Requirement 3.1-3.9 */}
      {selectedProductId && (
        <ProductDetailModal
          isOpen={isDetailModalOpen}
          productId={selectedProductId}
          onClose={() => setIsDetailModalOpen(false)}
          onAddToInstallment={handleAddToInstallment}
          onEdit={handleEditProduct}
          onManageInventory={handleManageInventory}
        />
      )}

      {/* Add Product Modal - Requirement 6.1-6.9 */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={showSuccess}
        onError={showError}
      />

      {/* Edit Product Modal - Requirement 7.1-7.9 */}
      {editProductId && (
        <EditProductModal
          isOpen={isEditModalOpen}
          productId={editProductId}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditProductId(null);
          }}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      {/* Manage Inventory Modal - Requirement 8.1-8.9 */}
      {inventoryProduct && (
        <ManageInventoryModal
          isOpen={isInventoryModalOpen}
          product={inventoryProduct}
          onClose={() => {
            setIsInventoryModalOpen(false);
            setInventoryProduct(null);
          }}
          onSuccess={showSuccess}
          onError={showError}
        />
      )}

      {/* Bulk Price Update Modal - Requirement 14.1-14.9 */}
      <BulkPriceUpdateModal
        isOpen={isBulkPriceUpdateModalOpen}
        selectedProducts={getSelectedProducts()}
        onClose={() => {
          setIsBulkPriceUpdateModalOpen(false);
        }}
        onSuccess={(message) => {
          showSuccess(message);
          setSelectedProductIds(new Set()); // Clear selection after successful update
          setBulkSelectionMode(false); // Exit bulk mode
        }}
        onError={showError}
      />

      {/* Installment Wizard - Requirement 4.1-4.8 */}
      <InstallmentWizard
        isOpen={isInstallmentWizardOpen}
        onClose={handleInstallmentWizardClose}
        onSuccess={handleInstallmentWizardSuccess}
        onError={handleInstallmentWizardError}
        preSelectedProductId={preSelectedProductId}
      />

      {/* Toast Notifications - Requirements: 6.9, 8.9, 10.9 */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </DashboardLayout>
  );
};

export default ProductCatalog;
