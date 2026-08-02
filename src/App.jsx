import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FamilyTreeGraph from './components/FamilyTreeGraph';
import PersonListView from './components/PersonListView';
import PersonModal from './components/PersonModal';
import FamilyModal from './components/FamilyModal';
import SpouseModal from './components/SpouseModal';
import PersonDetailsDrawer from './components/PersonDetailsDrawer';
import AuthModal from './components/AuthModal';

import { 
  getPersons, 
  savePerson, 
  deletePerson, 
  getFamilies, 
  saveFamily, 
  getMarriages,
  saveMarriage,
  deleteMarriage,
  resetToDemoData,
  isSupabaseConfigured,
  signOut,
  onAuthStateChange
} from './lib/supabase';

import { Loader } from 'lucide-react';

export default function App() {
  const [persons, setPersons] = useState([]);
  const [families, setFamilies] = useState([]);
  const [marriages, setMarriages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [activeView, setActiveView] = useState('tree'); // 'tree' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('secere_theme') || 'offwhite';
  });

  useEffect(() => {
    document.body.className = `theme-${currentTheme}`;
    localStorage.setItem('secere_theme', currentTheme);
  }, [currentTheme]);

  // Modals & Drawers State
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isSpouseModalOpen, setIsSpouseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [husbandForSpouseModal, setHusbandForSpouseModal] = useState(null);

  const [editingPerson, setEditingPerson] = useState(null);
  const [initialParentForChild, setInitialParentForChild] = useState(null);
  const [drawerPerson, setDrawerPerson] = useState(null);

  // Veri Yükleme
  const loadData = async () => {
    setLoading(true);
    try {
      const [personsData, familiesData, marriagesData] = await Promise.all([
        getPersons(),
        getFamilies(),
        getMarriages()
      ]);
      setPersons(personsData || []);
      setFamilies(familiesData || []);
      setMarriages(marriagesData || []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: authListener } = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      loadData();
    });
    loadData();

    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      await loadData();
    } catch (err) {
      console.error('Çıkış yapma hatası:', err);
    }
  };

  // Kişi Kaydet (Ekle / Güncelle)
  const handleSavePerson = async (personPayload) => {
    try {
      const saved = await savePerson(personPayload);
      await loadData();
      if (drawerPerson && drawerPerson.id === saved.id) {
        setDrawerPerson(saved);
      }
    } catch (err) {
      console.error('Kişi kaydetme hatası:', err);
      alert('Kişi kaydedilirken hata oluştu: ' + (err.message || err));
    }
  };

  // Kişi Sil
  const handleDeletePerson = async (personId) => {
    if (!window.confirm('Bu kişiyi soy ağacından silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      await deletePerson(personId);
      if (drawerPerson && drawerPerson.id === personId) {
        setDrawerPerson(null);
      }
      await loadData();
    } catch (err) {
      console.error('Kişi silme hatası:', err);
      alert('Silme sırasında hata oluştu: ' + (err.message || err));
    }
  };

  // Mevcut Kadını Eş Olarak Ekle
  const handleAddExistingSpouse = async (husbandId, wifeId) => {
    try {
      await saveMarriage(husbandId, wifeId);
      await loadData();
    } catch (err) {
      console.error('Eş ekleme hatası:', err);
      alert('Eş eklenirken hata oluştu: ' + (err.message || err));
    }
  };

  // Yeni Kadın Oluşturup Eş Olarak Ekle
  const handleCreateAndAddSpouse = async (husbandId, wifePayload) => {
    try {
      const savedWife = await savePerson(wifePayload);
      await saveMarriage(husbandId, savedWife.id);
      await loadData();
    } catch (err) {
      console.error('Yeni eş oluşturma hatası:', err);
      alert('Yeni eş oluşturulurken hata oluştu: ' + (err.message || err));
    }
  };

  // Eş Bağlantısını Kaldır
  const handleDeleteMarriage = async (husbandId, wifeId) => {
    if (!window.confirm('Bu eş bağlantısını kaldırmak istediğinize emin misiniz?')) {
      return;
    }
    try {
      await deleteMarriage(husbandId, wifeId);
      await loadData();
    } catch (err) {
      console.error('Eş kaldırma hatası:', err);
      alert('Eş kaldırılırken hata oluştu: ' + (err.message || err));
    }
  };

  // Sülale Kaydet
  const handleSaveFamily = async (familyPayload) => {
    try {
      await saveFamily(familyPayload);
      await loadData();
    } catch (err) {
      console.error('Sülale kaydetme hatası:', err);
      alert('Sülale kaydedilirken hata oluştu: ' + (err.message || err));
    }
  };

  // Demo Veriye Dön
  const handleResetDemoData = async () => {
    if (window.confirm('Tüm veriler varsayılan örnek Karasu Sülalesi soy verisine sıfırlanacak. Onaylıyor musunuz?')) {
      resetToDemoData();
      await loadData();
    }
  };

  // Çocuk Ekleme İşlemi Başlat
  const handleStartAddChild = (parentPerson) => {
    setEditingPerson(null);
    setInitialParentForChild(parentPerson);
    setIsPersonModalOpen(true);
  };

  // Düzenleme İşlemi Başlat
  const handleStartEditPerson = (person) => {
    setEditingPerson(person);
    setInitialParentForChild(null);
    setIsPersonModalOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedFamilyIds={selectedFamilyIds}
        setSelectedFamilyIds={setSelectedFamilyIds}
        families={families}
        persons={persons}
        currentTheme={currentTheme}
        setCurrentTheme={setCurrentTheme}
        onOpenAddPerson={() => {
          setEditingPerson(null);
          setInitialParentForChild(null);
          setIsPersonModalOpen(true);
        }}
        onOpenAddFamily={() => setIsFamilyModalOpen(true)}
        onResetDemoData={handleResetDemoData}
        personCount={persons.length}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      {/* Yükleniyor Ekranı */}
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
          <Loader size={36} color="#06b6d4" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Soy ağacı verileri yükleniyor...</p>
        </div>
      ) : (
        <main style={{ flex: 1, position: 'relative' }}>
          {activeView === 'tree' ? (
            <FamilyTreeGraph
              persons={persons}
              families={families}
              marriages={marriages}
              searchQuery={searchQuery}
              selectedFamilyIds={selectedFamilyIds}
              onSelectPerson={(person) => setDrawerPerson(person)}
              onAddChildOfPerson={handleStartAddChild}
            />
          ) : (
            <PersonListView
              persons={persons}
              families={families}
              marriages={marriages}
              searchQuery={searchQuery}
              selectedFamilyIds={selectedFamilyIds}
              onSelectPerson={(person) => setDrawerPerson(person)}
              onEditPerson={handleStartEditPerson}
              onDeletePerson={handleDeletePerson}
              onAddChild={handleStartAddChild}
            />
          )}
        </main>
      )}

      {/* Kişi Detay Çekmecesi (Drawer) */}
      <PersonDetailsDrawer
        person={drawerPerson}
        allPersons={persons}
        marriages={marriages}
        onClose={() => setDrawerPerson(null)}
        onEdit={(p) => handleStartEditPerson(p)}
        onDelete={(pId) => handleDeletePerson(pId)}
        onAddChild={(p) => handleStartAddChild(p)}
        onOpenAddSpouse={(husband) => {
          setHusbandForSpouseModal(husband);
          setIsSpouseModalOpen(true);
        }}
        onDeleteMarriage={handleDeleteMarriage}
        onSelectRelatedPerson={(relatedPerson) => setDrawerPerson(relatedPerson)}
      />

      {/* Kişi Ekle / Düzenle Modal */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={handleSavePerson}
        editingPerson={editingPerson}
        initialParent={initialParentForChild}
        persons={persons}
        families={families}
        marriages={marriages}
      />

      {/* Eş Ekle Modal */}
      <SpouseModal
        isOpen={isSpouseModalOpen}
        onClose={() => setIsSpouseModalOpen(false)}
        husbandPerson={husbandForSpouseModal}
        allPersons={persons}
        onAddExistingSpouse={handleAddExistingSpouse}
        onCreateAndAddSpouse={handleCreateAndAddSpouse}
      />

      {/* Sülale Ekle Modal */}
      <FamilyModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        onSave={handleSaveFamily}
        persons={persons}
      />

      {/* Üyelik / Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={loadData}
      />

    </div>
  );
}
