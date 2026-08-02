import React, { useState, useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  User, 
  Heart, 
  Info, 
  PlusCircle, 
  Crown,
  Layers,
  Sparkles,
  Filter,
  X,
  FileDown,
  Loader2,
  Printer
} from 'lucide-react';

export default function FamilyTreeGraph({
  persons = [],
  families = [],
  marriages = [],
  selectedFamilyIds = [],
  onSelectPerson,
  onAddChildOfPerson,
  searchQuery = ''
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [patrilinealOnly, setPatrilinealOnly] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // Seçili sülale isimleri
  const selectedFamilyNames = useMemo(() => {
    if (!selectedFamilyIds || selectedFamilyIds.length === 0) return null;
    return families
      .filter((f) => selectedFamilyIds.includes(f.id))
      .map((f) => f.name)
      .join(', ');
  }, [families, selectedFamilyIds]);

  // 1. Soy Ağacı Konumlandırma Hesaplaması (Sadece Seçili Sülale Filtresi Dahil)
  const treeLayout = useMemo(() => {
    if (!persons || persons.length === 0) return { nodes: [], links: [], spouseLinks: [], nodeCoordMap: new Map(), detailLevel: 'full' };

    // Sülale Filtrelemesi
    let targetPersons = persons;
    if (selectedFamilyIds && selectedFamilyIds.length > 0) {
      const selectedSet = new Set(selectedFamilyIds);
      const familyMemberIds = new Set(
        persons.filter(p => p.family_id && selectedSet.has(p.family_id)).map(p => p.id)
      );

      targetPersons = persons.filter(p => {
        if (p.family_id && selectedSet.has(p.family_id)) return true;
        // Aile üyesinin eşi veya çocuğu ise dahil et
        if (p.father_id && familyMemberIds.has(p.father_id)) return true;
        if (p.mother_id && familyMemberIds.has(p.mother_id)) return true;
        return false;
      });
    }

    if (targetPersons.length === 0) return { nodes: [], links: [], spouseLinks: [], nodeCoordMap: new Map(), detailLevel: 'full' };

    // Kişileri ID haritasına aktar
    const personMap = new Map();
    targetPersons.forEach(p => personMap.set(p.id, { ...p, children: [], generation: 1, subtreeWidth: 0 }));

    // Eş (Karı-Koca) Haritası Oluştur (Husband ID -> Wives Array)
    const husbandToWivesMap = new Map();
    const wifeToHusbandMap = new Map();

    // A) Marriages tablosundan eş ilişkileri
    marriages.forEach(m => {
      if (m.husband_id && m.wife_id) {
        if (personMap.has(m.husband_id) && personMap.has(m.wife_id)) {
          if (!husbandToWivesMap.has(m.husband_id)) husbandToWivesMap.set(m.husband_id, []);
          const wifeObj = personMap.get(m.wife_id);
          if (!husbandToWivesMap.get(m.husband_id).some(w => w.id === m.wife_id)) {
            husbandToWivesMap.get(m.husband_id).push(wifeObj);
            wifeToHusbandMap.set(m.wife_id, m.husband_id);
          }
        }
      }
    });

    // B) Çocukların anne ve baba bağlantılarından eş ve çocuk ilişkisi
    targetPersons.forEach(p => {
      if (p.father_id && personMap.has(p.father_id)) {
        personMap.get(p.father_id).children.push(p.id);
      }
      if (p.father_id && p.mother_id && personMap.has(p.father_id) && personMap.has(p.mother_id)) {
        const hId = p.father_id;
        const wObj = personMap.get(p.mother_id);
        if (!husbandToWivesMap.has(hId)) husbandToWivesMap.set(hId, []);
        if (!husbandToWivesMap.get(hId).some(w => w.id === wObj.id)) {
          husbandToWivesMap.get(hId).push(wObj);
          wifeToHusbandMap.set(wObj.id, hId);
        }
      }
    });

    const isWifeAttachedToHusband = (personId) => wifeToHusbandMap.has(personId);

    // Zoom seviyesine göre dinamik Kart Boyutları & Aralıkları (LOD - Level of Detail)
    let MAIN_NODE_WIDTH, MAIN_NODE_HEIGHT, WIFE_NODE_WIDTH, WIFE_NODE_HEIGHT, WIFE_GAP_X, GAP_X, GAP_Y, detailLevel;

    if (zoom >= 0.85) {
      // Tam Detay Modu (Varsayılan Daraltılmış Boyutlar)
      MAIN_NODE_WIDTH = 175;
      MAIN_NODE_HEIGHT = 100;
      WIFE_NODE_WIDTH = 110;
      WIFE_NODE_HEIGHT = 50;
      WIFE_GAP_X = 8;
      GAP_X = 35;
      GAP_Y = 90;
      detailLevel = 'full';
    } else if (zoom >= 0.55) {
      // Kompakt Mod (Uzaklaşınca daha da dar ve butonlar gizli)
      MAIN_NODE_WIDTH = 140;
      MAIN_NODE_HEIGHT = 72;
      WIFE_NODE_WIDTH = 90;
      WIFE_NODE_HEIGHT = 40;
      WIFE_GAP_X = 6;
      GAP_X = 24;
      GAP_Y = 70;
      detailLevel = 'compact';
    } else {
      // Mikro / Ultra Kompakt Mod (En uzak seviye)
      MAIN_NODE_WIDTH = 110;
      MAIN_NODE_HEIGHT = 52;
      WIFE_NODE_WIDTH = 72;
      WIFE_NODE_HEIGHT = 32;
      WIFE_GAP_X = 4;
      GAP_X = 16;
      GAP_Y = 52;
      detailLevel = 'micro';
    }

    // ADIM 1: Alt Soy Genişliğini (Subtree Width) Hesapla
    const calcSubtreeWidth = (id, visited = new Set()) => {
      if (visited.has(id)) return MAIN_NODE_WIDTH;
      visited.add(id);

      const node = personMap.get(id);
      if (!node) return MAIN_NODE_WIDTH;

      if (searchQuery.trim() !== '') {
        const fullName = `${node.first_name} ${node.last_name}`.toLowerCase();
        if (!fullName.includes(searchQuery.toLowerCase())) {
          node.subtreeWidth = 0;
          return 0;
        }
      }

      const primaryChildren = node.children.filter(cId => !isWifeAttachedToHusband(cId));

      if (primaryChildren.length === 0) {
        node.subtreeWidth = MAIN_NODE_WIDTH;
      } else {
        let totalChildrenWidth = 0;
        let validChildCount = 0;
        primaryChildren.forEach((cId) => {
          const w = calcSubtreeWidth(cId, visited);
          if (w > 0) {
            totalChildrenWidth += w;
            validChildCount++;
          }
        });
        if (validChildCount > 1) {
          totalChildrenWidth += (validChildCount - 1) * GAP_X;
        }
        node.subtreeWidth = Math.max(MAIN_NODE_WIDTH, totalChildrenWidth);
      }

      const wives = husbandToWivesMap.get(id) || [];
      if (!patrilinealOnly && wives.length > 0) {
        const totalWivesWidth = wives.length * WIFE_NODE_WIDTH + (wives.length - 1) * WIFE_GAP_X;
        node.subtreeWidth = Math.max(node.subtreeWidth, totalWivesWidth);
      }

      return node.subtreeWidth;
    };

    const rootNodes = targetPersons.filter(p => !p.father_id && !isWifeAttachedToHusband(p.id));
    rootNodes.forEach(r => calcSubtreeWidth(r.id));

    // ADIM 2: Düğümleri Çocukları Kendi Ortasında Hizalayarak Yerleştir
    const nodesWithCoords = [];
    const nodeCoordMap = new Map();
    const spouseLinks = [];

    let totalRootsWidth = 0;
    const validRootNodes = rootNodes.filter(r => personMap.get(r.id).subtreeWidth > 0);

    validRootNodes.forEach((r, idx) => {
      const node = personMap.get(r.id);
      totalRootsWidth += node.subtreeWidth;
      if (idx < validRootNodes.length - 1) totalRootsWidth += GAP_X;
    });

    let currentRootX = -totalRootsWidth / 2;

    const positionSubtree = (nodeId, x, y, visited = new Set()) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = personMap.get(nodeId);
      if (!node || node.subtreeWidth === 0) return;

      const mainNodeObj = {
        ...node,
        x,
        y,
        width: MAIN_NODE_WIDTH,
        height: MAIN_NODE_HEIGHT,
        isSpouseSubCard: false
      };

      nodesWithCoords.push(mainNodeObj);
      nodeCoordMap.set(node.id, mainNodeObj);

      const wives = husbandToWivesMap.get(node.id) || [];
      let extraHeightForWives = 0;

      if (!patrilinealOnly && wives.length > 0) {
        extraHeightForWives = WIFE_NODE_HEIGHT + 8;
        const totalWivesWidth = wives.length * WIFE_NODE_WIDTH + (wives.length - 1) * WIFE_GAP_X;
        const husbandCenterX = x + MAIN_NODE_WIDTH / 2;
        const wivesStartX = husbandCenterX - totalWivesWidth / 2;

        wives.forEach((wifeObj, wifeIdx) => {
          const wifeX = wivesStartX + wifeIdx * (WIFE_NODE_WIDTH + WIFE_GAP_X);
          const wifeY = y + MAIN_NODE_HEIGHT + 6;

          const wifeNodeObj = {
            ...wifeObj,
            x: wifeX,
            y: wifeY,
            width: WIFE_NODE_WIDTH,
            height: WIFE_NODE_HEIGHT,
            isSpouseSubCard: true,
            husbandId: node.id
          };

          nodesWithCoords.push(wifeNodeObj);
          nodeCoordMap.set(wifeObj.id, wifeNodeObj);

          spouseLinks.push({
            id: `spouse-link-${node.id}-${wifeObj.id}`,
            husband: mainNodeObj,
            wife: wifeNodeObj
          });
        });
      }

      const primaryChildren = node.children
        .map(cId => personMap.get(cId))
        .filter(c => c && !isWifeAttachedToHusband(c.id) && c.subtreeWidth > 0);

      if (primaryChildren.length > 0) {
        let totalChildrenSubtreeWidth = 0;
        primaryChildren.forEach((childNode, idx) => {
          totalChildrenSubtreeWidth += childNode.subtreeWidth;
          if (idx < primaryChildren.length - 1) totalChildrenSubtreeWidth += GAP_X;
        });

        const parentCenterX = x + MAIN_NODE_WIDTH / 2;
        let currentChildX = parentCenterX - totalChildrenSubtreeWidth / 2;
        const childY = y + MAIN_NODE_HEIGHT + extraHeightForWives + GAP_Y;

        primaryChildren.forEach(childNode => {
          const actualChildX = currentChildX + (childNode.subtreeWidth - MAIN_NODE_WIDTH) / 2;
          positionSubtree(childNode.id, actualChildX, childY, visited);
          currentChildX += childNode.subtreeWidth + GAP_X;
        });
      }
    };

    validRootNodes.forEach(r => {
      const node = personMap.get(r.id);
      const rootX = currentRootX + (node.subtreeWidth - MAIN_NODE_WIDTH) / 2;
      positionSubtree(r.id, rootX, 50);
      currentRootX += node.subtreeWidth + GAP_X;
    });

    const links = [];
    nodesWithCoords.forEach(node => {
      if (node.father_id && nodeCoordMap.has(node.father_id)) {
        const fatherNode = nodeCoordMap.get(node.father_id);
        links.push({
          id: `link-p-${fatherNode.id}-${node.id}`,
          from: fatherNode,
          to: node,
          type: 'patrilineal'
        });
      }
    });

    return { nodes: nodesWithCoords, links, spouseLinks, nodeCoordMap, detailLevel };
  }, [persons, searchQuery, patrilinealOnly, marriages, selectedFamilyIds, zoom]);

  // Pan / Drag
  const handleMouseDown = (e) => {
    if (e.target.closest('.node-card')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.35), 2.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // PDF Dökümü Alma (Anında Çalışan Hafif 2D Canvas & Instant PDF İndirme)
  const handleExportPdf = async () => {
    if (!treeLayout.nodes || treeLayout.nodes.length === 0) {
      alert('Dışa aktarılacak soy ağacı düğümü bulunamadı.');
      return;
    }

    setIsExportingPdf(true);
    try {
      // 1. Soy Ağacının Sınırlarını Hesapla
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      treeLayout.nodes.forEach(n => {
        minX = Math.min(minX, n.x);
        maxX = Math.max(maxX, n.x + n.width);
        minY = Math.min(minY, n.y);
        maxY = Math.max(maxY, n.y + n.height);
      });

      const padding = 50;
      const rawW = Math.ceil((maxX - minX) + padding * 2);
      const rawH = Math.ceil((maxY - minY) + padding * 2);

      // Güvenli ve anında çalışan hafif tuval boyutlandırması
      const maxDim = 1600;
      const scaleFactor = Math.min(1, maxDim / Math.max(rawW, rawH));
      const width = Math.round(rawW * scaleFactor);
      const height = Math.round(rawH * scaleFactor);

      // 2. Hafif HTML5 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Arka plan
      let bgHex = '#f4f0e8';
      let cardBgHex = '#ffffff';
      let textPrimaryHex = '#1e293b';
      let textSecondaryHex = '#64748b';

      if (document.body.classList.contains('theme-wood')) {
        bgHex = '#3d2314';
        cardBgHex = '#fdf6e3';
        textPrimaryHex = '#3b1d06';
        textSecondaryHex = '#733c10';
      } else if (document.body.classList.contains('theme-dark')) {
        bgHex = '#0b0f19';
        cardBgHex = '#121826';
        textPrimaryHex = '#f3f4f6';
        textSecondaryHex = '#9ca3af';
      } else if (document.body.classList.contains('theme-emerald')) {
        bgHex = '#0c1a17';
        cardBgHex = '#102420';
        textPrimaryHex = '#ecfdf5';
        textSecondaryHex = '#6ee7b7';
      }

      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, width, height);

      // Çizim Ofsetleri
      const offsetX = (-minX + padding) * scaleFactor;
      const offsetY = (-minY + padding) * scaleFactor;

      // A) Koca <-> Eş Çizgileri
      treeLayout.spouseLinks.forEach(sLink => {
        const x1 = (sLink.husband.x + sLink.husband.width / 2) * scaleFactor + offsetX;
        const y1 = (sLink.husband.y + sLink.husband.height) * scaleFactor + offsetY;
        const x2 = (sLink.wife.x + sLink.wife.width / 2) * scaleFactor + offsetX;
        const y2 = sLink.wife.y * scaleFactor + offsetY;

        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // B) Baba -> Çocuk Bağlantı Çizgileri
      treeLayout.links.forEach(link => {
        const fatherNode = link.from;
        const wivesOfFather = treeLayout.nodes.filter(n => n.isSpouseSubCard && n.husbandId === fatherNode.id);
        const lowestYNode = wivesOfFather.length > 0 ? wivesOfFather[0] : fatherNode;

        const x1 = (fatherNode.x + fatherNode.width / 2) * scaleFactor + offsetX;
        const y1 = (lowestYNode.y + lowestYNode.height) * scaleFactor + offsetY;
        const x2 = (link.to.x + link.to.width / 2) * scaleFactor + offsetX;
        const y2 = link.to.y * scaleFactor + offsetY;

        const midY = (y1 + y2) / 2;

        ctx.beginPath();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5 * scaleFactor;
        ctx.lineCap = 'round';
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(x1, midY, x2, midY, x2, y2);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = '#06b6d4';
        ctx.arc(x1, y1, 3 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#10b981';
        ctx.arc(x2, y2, 3 * scaleFactor, 0, Math.PI * 2);
        ctx.fill();
      });

      // C) Kişi Kartları
      treeLayout.nodes.forEach(node => {
        const nx = node.x * scaleFactor + offsetX;
        const ny = node.y * scaleFactor + offsetY;
        const nw = node.width * scaleFactor;
        const nh = node.height * scaleFactor;
        const isMale = node.gender === 'male';

        const radius = Math.max(2, 6 * scaleFactor);
        ctx.beginPath();
        ctx.moveTo(nx + radius, ny);
        ctx.lineTo(nx + nw - radius, ny);
        ctx.quadraticCurveTo(nx + nw, ny, nx + nw, ny + radius);
        ctx.lineTo(nx + nw, ny + nh - radius);
        ctx.quadraticCurveTo(nx + nw, ny + nh, nx + nw - radius, ny + nh);
        ctx.lineTo(nx + radius, ny + nh);
        ctx.quadraticCurveTo(nx, ny + nh, nx, ny + nh - radius);
        ctx.lineTo(nx, ny + radius);
        ctx.quadraticCurveTo(nx, ny, nx + radius, ny);
        ctx.closePath();

        ctx.fillStyle = node.isSpouseSubCard ? (document.body.classList.contains('theme-wood') ? '#fdeded' : '#281326') : cardBgHex;
        ctx.fill();

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = isMale ? '#0284c7' : '#ec4899';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Rozet
        ctx.fillStyle = isMale ? '#0284c7' : '#ec4899';
        ctx.font = `bold ${Math.max(7, Math.round(8.5 * scaleFactor))}px sans-serif`;
        const badgeText = node.isSpouseSubCard ? 'EŞ' : (isMale ? 'ERKEK SOY' : 'KADIN');
        ctx.fillText(badgeText, nx + 8 * scaleFactor, ny + 6 * scaleFactor);

        if (node.is_deceased) {
          ctx.fillStyle = textSecondaryHex;
          ctx.fillText('VEFAT', nx + nw - 35 * scaleFactor, ny + 6 * scaleFactor);
        }

        // Ad Soyad
        ctx.fillStyle = textPrimaryHex;
        ctx.font = `bold ${Math.max(9, Math.round(11 * scaleFactor))}px sans-serif`;
        const nameStr = `${node.first_name} ${node.last_name}`;
        ctx.fillText(nameStr, nx + 8 * scaleFactor, ny + 20 * scaleFactor);

        // Yaşam Yılları
        ctx.fillStyle = textSecondaryHex;
        ctx.font = `${Math.max(8, Math.round(9.5 * scaleFactor))}px sans-serif`;
        const yearStr = `d. ${node.birth_year || '???'}${node.is_deceased ? ` - ö. ${node.death_year || '?'}` : ''}`;
        ctx.fillText(yearStr, nx + 8 * scaleFactor, ny + 38 * scaleFactor);
      });

      // 3. Canvas'tan Hızlıca PNG Verisini Al
      const imgData = canvas.toDataURL('image/png');

      // 4. jsPDF ile Belgeye Dönüştür ve İndir
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const availableW = pageWidth - margin * 2;
      const availableH = pageHeight - margin * 2;

      const fitScale = Math.min(availableW / width, availableH / height);
      const renderW = width * fitScale;
      const renderH = height * fitScale;
      const posX = margin + (availableW - renderW) / 2;
      const posY = margin + (availableH - renderH) / 2;

      pdf.addImage(imgData, 'PNG', posX, posY, renderW, renderH);

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `secere_soy_agaci_${dateStr}.pdf`;

      // Saf PDF ikili verisi (ArrayBuffer) ile %100 geçerli application/pdf Blob oluştur
      const pdfArrayBuffer = pdf.output('arraybuffer');
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      downloadLink.setAttribute('download', fileName);
      downloadLink.type = 'application/pdf';

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      alert('PDF oluşturulurken hata: ' + (err.message || err));
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: 'calc(100vh - 75px)', 
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Seçili Sülale Banner Bilgisi (Aktif Filtre Varsa) */}
      {selectedFamilyNames && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.6rem 1rem',
          borderRadius: '0.85rem',
          background: 'rgba(245, 158, 11, 0.15)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          boxShadow: '0 8px 25px rgba(0,0,0,0.4)'
        }}>
          <Filter size={16} color="#fbbf24" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            Aktif Sülale Görünümü: {selectedFamilyNames}
          </span>
        </div>
      )}

      {/* Araç Çubuğu */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem',
        borderRadius: '1rem',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))} title="Yakınlaştır">
          <ZoomIn size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom(z => Math.max(z - 0.15, 0.35))} title="Uzaklaştır">
          <ZoomOut size={16} />
        </button>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0 0.4rem' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button className="btn btn-secondary btn-sm" onClick={resetView} title="Sıfırla">
          <RotateCcw size={16} />
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 0.2rem' }} />

        <button 
          className={`btn btn-sm ${patrilinealOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPatrilinealOnly(!patrilinealOnly)}
        >
          <Crown size={15} color={patrilinealOnly ? '#fbbf24' : 'currentColor'} />
          {patrilinealOnly ? 'Erkek Soyu (Patrilinear)' : 'Tüm Soy Ağacı'}
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)', margin: '0 0.2rem' }} />

        {/* PDF İndirme Butonu */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={handleExportPdf}
          disabled={isExportingPdf}
          title="Soy Ağacını Otomatik PDF Olarak İndir"
          style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)' }}
        >
          {isExportingPdf ? (
            <>
              <Loader2 size={15} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>PDF Hazırlanıyor...</span>
            </>
          ) : (
            <>
              <FileDown size={15} color="#38bdf8" />
              <span>PDF İndir</span>
            </>
          )}
        </button>

        {/* Tarayıcı Yerel PDF / Yazdır Ekranı */}
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => window.print()}
          title="Tarayıcının 'PDF Olarak Kaydet' Ekranını Aç"
        >
          <Printer size={15} color="var(--accent-gold)" />
          <span>Yazdır / PDF Kaydet</span>
        </button>
      </div>

      {/* Canvas Container */}
      <div
        ref={canvasContainerRef}
        style={{
          transform: `translate(${pan.x + (containerRef.current?.clientWidth || 1000) / 2}px, ${pan.y + 100}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging || isExportingPdf ? 'none' : 'transform 0.1s cubic-bezier(0.2, 0, 0, 1)',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {/* SVG Bağlantı Çizgileri */}
        <svg
          style={{
            position: 'absolute',
            top: -2000,
            left: -2000,
            width: 8000,
            height: 8000,
            pointerEvents: 'none',
            overflow: 'visible'
          }}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Koca <-> Eş Yan Yana Bağlantı Çizgileri */}
          {treeLayout.spouseLinks.map(sLink => {
            const x1 = sLink.husband.x + sLink.husband.width / 2 + 2000;
            const y1 = sLink.husband.y + sLink.husband.height + 2000;
            const x2 = sLink.wife.x + sLink.wife.width / 2 + 2000;
            const y2 = sLink.wife.y + 2000;

            return (
              <g key={sLink.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#ec4899"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          {/* Baba -> Çocuk Soy Bağlantı Çizgileri */}
          {treeLayout.links.map(link => {
            const fatherNode = link.from;
            const wivesOfFather = treeLayout.nodes.filter(n => n.isSpouseSubCard && n.husbandId === fatherNode.id);
            const lowestYNode = wivesOfFather.length > 0 
              ? wivesOfFather[0] 
              : fatherNode;

            const x1 = fatherNode.x + fatherNode.width / 2 + 2000;
            const y1 = lowestYNode.y + lowestYNode.height + 2000;
            const x2 = link.to.x + link.to.width / 2 + 2000;
            const y2 = link.to.y + 2000;

            const adjustedX2 = Math.abs(x1 - x2) < 1 ? x1 + 0.5 : x2;
            const midY = (y1 + y2) / 2;
            const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${adjustedX2} ${midY}, ${adjustedX2} ${y2}`;

            return (
              <g key={link.id}>
                {!isExportingPdf && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(6, 182, 212, 0.45)"
                    strokeWidth={6}
                    filter="url(#glow)"
                  />
                )}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                />
                <circle cx={x1} cy={y1} r="4" fill="#06b6d4" />
                <circle cx={adjustedX2} cy={y2} r="4" fill="#10b981" />
              </g>
            );
          })}
        </svg>

        {/* Kişi & Eş Kartları */}
        {treeLayout.nodes.map(node => {
          const isSelected = selectedPersonId === node.id;
          const isMale = node.gender === 'male';
          const isSpouseCard = node.isSpouseSubCard;
          const detailLevel = treeLayout.detailLevel;

          const fatherObj = treeLayout.nodeCoordMap.get(node.father_id);

          // EŞ (KADIN) KART TASARIMI
          if (isSpouseCard) {
            return (
              <div
                key={node.id}
                className="node-card glass-panel"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPersonId(node.id);
                  onSelectPerson(node);
                }}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  width: `${node.width}px`,
                  height: `${node.height}px`,
                  padding: detailLevel === 'micro' ? '0.15rem 0.3rem' : detailLevel === 'compact' ? '0.25rem 0.4rem' : '0.35rem 0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'center',
                  cursor: 'pointer',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-card-spouse)',
                  border: isSelected
                    ? '2px solid #ec4899'
                    : '1px dashed rgba(236, 72, 153, 0.6)',
                  boxShadow: isSelected
                    ? '0 0 18px rgba(236, 72, 153, 0.6)'
                    : '0 4px 12px rgba(236, 72, 153, 0.15)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isSelected ? 'scale(1.04)' : 'none',
                  zIndex: isSelected ? 10 : 2
                }}
              >
                {detailLevel !== 'micro' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.05rem' }}>
                    <span style={{ fontSize: '0.55rem', fontWeight: 700, color: 'var(--accent-female)', display: 'flex', alignItems: 'center', gap: '0.15rem', textTransform: 'uppercase' }}>
                      <Heart size={9} color="var(--accent-female)" fill="var(--accent-female)" /> {detailLevel === 'compact' ? '' : 'EŞ'}
                    </span>
                    {node.is_deceased && <span className="badge badge-deceased" style={{ fontSize: '0.5rem', padding: '0.02rem 0.2rem' }}>Ö</span>}
                  </div>
                )}

                <h4 style={{ 
                  fontSize: detailLevel === 'micro' ? '0.65rem' : detailLevel === 'compact' ? '0.72rem' : '0.78rem', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}>
                  {node.first_name} {node.last_name}
                </h4>

                <p style={{ fontSize: detailLevel === 'micro' ? '0.55rem' : '0.62rem', color: 'var(--text-secondary)', marginTop: '0.02rem' }}>
                  d. {node.birth_year || '???'} {node.is_deceased && detailLevel !== 'micro' && `- ö. ${node.death_year || '?'}`}
                </p>
              </div>
            );
          }

          // ANA KİŞİ (ERKEK VEYA SERBEST KADIN) KART TASARIMI
          return (
            <div
              key={node.id}
              className="node-card glass-panel"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPersonId(node.id);
                onSelectPerson(node);
              }}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${node.width}px`,
                height: `${node.height}px`,
                padding: detailLevel === 'micro' ? '0.2rem 0.35rem' : detailLevel === 'compact' ? '0.4rem 0.5rem' : '0.65rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                cursor: 'pointer',
                border: isSelected
                  ? '2px solid var(--accent-male)'
                  : isMale
                  ? '1px solid var(--accent-male-glow)'
                  : '1px solid var(--accent-female-glow)',
                boxShadow: isSelected
                  ? '0 0 25px var(--accent-male-glow)'
                  : isMale
                  ? '0 4px 20px var(--accent-male-glow)'
                  : '0 4px 20px var(--accent-female-glow)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isSelected ? 'scale(1.03)' : 'none',
                zIndex: isSelected ? 10 : 1
              }}
            >
              {/* Kart Üst Tarafı: Cinsiyet Badge + Vefat (Mikro modda gizli) */}
              {detailLevel !== 'micro' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={`badge ${isMale ? 'badge-male' : 'badge-female'}`} style={{ fontSize: detailLevel === 'compact' ? '0.55rem' : '0.65rem', padding: detailLevel === 'compact' ? '0.05rem 0.3rem' : '0.1rem 0.4rem' }}>
                    {isMale ? (detailLevel === 'compact' ? 'SOY' : 'ERKEK SOY') : 'KADIN'}
                  </span>
                  {node.is_deceased && (
                    <span className="badge badge-deceased" style={{ fontSize: detailLevel === 'compact' ? '0.55rem' : '0.65rem', padding: detailLevel === 'compact' ? '0.05rem 0.25rem' : '0.1rem 0.3rem' }}>VEFAT</span>
                  )}
                </div>
              )}

              {/* Orta Taraf: İsim & Yaşam Yılları */}
              <div style={{ margin: detailLevel === 'full' ? '0.15rem 0' : '0' }}>
                <h3 style={{ 
                  fontSize: detailLevel === 'micro' ? '0.68rem' : detailLevel === 'compact' ? '0.78rem' : '0.9rem', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2
                }}>
                  {node.first_name} {node.last_name}
                </h3>
                <p style={{ fontSize: detailLevel === 'micro' ? '0.58rem' : detailLevel === 'compact' ? '0.65rem' : '0.7rem', color: 'var(--text-secondary)' }}>
                  d. {node.birth_year || '???'} {node.is_deceased && detailLevel === 'full' && `- ö. ${node.death_year || '?'}`}
                </p>
              </div>

              {/* Alt Taraf: Baba & Çocuk Ekle (Yalnızca Tam Detay Modunda) */}
              {detailLevel === 'full' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    {fatherObj && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
                        <Crown size={9} color="#06b6d4" />
                        <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fatherObj.first_name}</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddChildOfPerson(node);
                    }}
                    title={`${node.first_name} kişisine çocuk ekle`}
                    style={{ padding: '0.15rem 0.35rem', fontSize: '0.62rem', background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                  >
                    <PlusCircle size={10} />
                    +Çocuk
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Boş Arama Uyarısı */}
        {treeLayout.nodes.length === 0 && (
          <div className="glass-panel" style={{ padding: '2rem 3rem', textAlign: 'center', width: '350px' }}>
            <Info size={32} color="#38bdf8" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1rem', color: '#ffffff', marginBottom: '0.5rem' }}>Eşleşen Birey Bulunamadı</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Seçtiğiniz sülaleye veya arama kriterinize uygun kayıt bulunmuyor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
