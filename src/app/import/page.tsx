'use client';

import { useEffect, useState, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import FileDropZone from '@/components/ui/FileDropZone';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import type { OntologyClass } from '@/types';

const templates = [
  { id: 'cleaning', name: '청소업체', description: '고객→문의→견적→시공→리뷰 워크플로우', icon: '🧹' },
  { id: 'ecommerce', name: '이커머스', description: '고객→주문→상품→카테고리 구조', icon: '🛒' },
  { id: 'saas', name: 'SaaS', description: '유저→구독→플랜→기능 구조', icon: '☁️' },
  { id: 'agency', name: '마케팅 에이전시', description: '클라이언트→캠페인→채널→성과 구조', icon: '📊' },
  { id: 'empty', name: '빈 템플릿', description: '빈 워크스페이스에서 시작', icon: '📄' },
];

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState<'csv' | 'template' | 'json'>('template');
  const [classes, setClasses] = useState<OntologyClass[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({ companyName: '', ceoName: '', mainService: '' });
  const [csvText, setCsvText] = useState('');
  const [csvClassId, setCsvClassId] = useState('');
  const [csvNameCol, setCsvNameCol] = useState('0');
  const [csvPreview, setCsvPreview] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => setClasses(d.items));
  }, []);

  // Parse CSV for preview
  const parseCsv = useCallback((text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1, 6).map(line => line.split(',').map(c => c.trim())); // preview 5 rows
    setCsvPreview({ headers, rows });
  }, []);

  const handleFileLoad = useCallback((content: string, fileName: string) => {
    setCsvText(content);
    parseCsv(content);
    toast(`"${fileName}" 로드 완료`, 'info');
  }, [parseCsv, toast]);

  const handleCsvImport = async () => {
    if (!csvText.trim() || !csvClassId) {
      toast('CSV 데이터와 대상 클래스를 모두 설정해주세요.', 'warning');
      return;
    }
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const nameColIdx = parseInt(csvNameCol);

    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < headers.length) continue;

      const properties: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (idx !== nameColIdx) properties[h] = cols[idx];
      });

      await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cols[nameColIdx] || `항목_${i}`,
          classId: csvClassId,
          properties,
        }),
      });
      count++;
    }
    toast(`${count}개 엔티티가 생성되었습니다.`, 'success');
  };

  const handleTemplateApply = () => {
    toast(`"${templates.find(t => t.id === selectedTemplate)?.name}" 템플릿이 적용되었습니다.`, 'success');
    setWizardStep(0);
    setSelectedTemplate(null);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">데이터 임포트</h1>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'template' as const, label: '온보딩 마법사' },
          { id: 'csv' as const, label: 'CSV 임포트' },
          { id: 'json' as const, label: 'JSON 익스포트' },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Template Tab */}
      {activeTab === 'template' && (
        <div>
          {wizardStep === 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Step 1: 업종 선택</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(t => (
                  <Card
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t.id); setWizardStep(1); }}
                    className={`cursor-pointer hover:border-[#E85D3A] transition-colors ${selectedTemplate === t.id ? 'border-[#E85D3A]' : ''}`}
                  >
                    <div className="text-center">
                      <span className="text-4xl">{t.icon}</span>
                      <h4 className="text-white font-semibold mt-2">{t.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="max-w-lg">
              <h3 className="text-lg font-semibold mb-4">Step 2: 기본 정보 입력</h3>
              <div className="space-y-3">
                <Input label="회사명" value={wizardData.companyName} onChange={e => setWizardData({ ...wizardData, companyName: e.target.value })} placeholder="예: 브로스" />
                <Input label="대표자명" value={wizardData.ceoName} onChange={e => setWizardData({ ...wizardData, ceoName: e.target.value })} placeholder="예: 김민준" />
                <Input label="주요 서비스" value={wizardData.mainService} onChange={e => setWizardData({ ...wizardData, mainService: e.target.value })} placeholder="예: 입주청소" />
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setWizardStep(0)}>이전</Button>
                  <Button onClick={() => setWizardStep(2)}>다음</Button>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="max-w-lg">
              <h3 className="text-lg font-semibold mb-4">Step 3: 확인 및 생성</h3>
              <Card className="p-4 mb-4">
                <p className="text-sm"><span className="text-gray-400">업종:</span> {templates.find(t => t.id === selectedTemplate)?.name}</p>
                <p className="text-sm"><span className="text-gray-400">회사명:</span> {wizardData.companyName || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">대표자:</span> {wizardData.ceoName || '-'}</p>
                <p className="text-sm"><span className="text-gray-400">주요 서비스:</span> {wizardData.mainService || '-'}</p>
              </Card>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setWizardStep(1)}>이전</Button>
                <Button onClick={handleTemplateApply}>그래프 생성</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Tab */}
      {activeTab === 'csv' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="text-lg font-semibold">CSV 데이터 임포트</h3>

            {/* File Drop Zone */}
            <FileDropZone onFileLoad={handleFileLoad} accept=".csv,.txt" />

            <div className="text-center text-xs text-gray-600">또는 직접 입력</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="대상 클래스"
                value={csvClassId}
                onChange={(e) => setCsvClassId(e.target.value)}
                options={[{ value: '', label: '선택...' }, ...classes.map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }))]}
              />
              <Input label="이름 열 번호 (0부터)" value={csvNameCol} onChange={e => setCsvNameCol(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-gray-400">CSV 데이터 (첫 줄은 헤더)</label>
              <textarea
                value={csvText}
                onChange={(e) => { setCsvText(e.target.value); parseCsv(e.target.value); }}
                rows={6}
                placeholder={`name,phone,email\n홍길동,010-1234-5678,hong@email.com`}
                className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#E85D3A]"
              />
            </div>

            <Button onClick={handleCsvImport}>임포트 실행</Button>
          </Card>

          {/* CSV Preview */}
          {csvPreview && (
            <Card className="p-5">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">미리보기 (최대 5행)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-[#2a2a2a]">
                    <tr>
                      {csvPreview.headers.map((h, i) => (
                        <th key={i} className="text-left px-3 py-2 text-gray-500">
                          <div className="flex items-center gap-1">
                            {h}
                            {i === parseInt(csvNameCol) && <Badge color="#E85D3A">이름</Badge>}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row, i) => (
                      <tr key={i} className="border-b border-[#1a1a1a]">
                        {row.map((cell, j) => (
                          <td key={j} className={`px-3 py-1.5 ${j === parseInt(csvNameCol) ? 'text-white font-medium' : 'text-gray-400'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* JSON Tab */}
      {activeTab === 'json' && (
        <Card className="p-5 space-y-4">
          <h3 className="text-lg font-semibold">JSON 익스포트</h3>
          <p className="text-sm text-gray-400">현재 데이터를 JSON 형태로 다운로드합니다.</p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => { window.open('/api/export/json', '_blank'); toast('JSON 익스포트 완료', 'success'); }}>전체 데이터 JSON</Button>
            <Button variant="secondary" onClick={() => { window.open('/api/export/triples', '_blank'); toast('트리플 익스포트 완료', 'success'); }}>트리플 형태</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
