import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';

// CONFIGURACIÓN PROFESIONAL (IA-GABINETE PSIQUE)
const PROFESIONAL_DATA = {
  nombre: 'LAURA PASCUAL JIMENEZ',
  dni: '33522200E',
  email: 'laura.pscl@gmail.com',
  localidad: 'Madrid'
};

const INITIAL_DATA = {
  tutor: '', dni_tutor: '', menor: '', dni_menor: '', telf: '', email_cliente: '',
  auth1: false, auth2: false, auth3: false
};

export default function App() {
  const [data, setData] = useState(INITIAL_DATA);
  const [isGenerating, setIsGenerating] = useState(false);
  const sigPadTutor = useRef({});
  const sigPadMenor = useRef({});

  const handleInput = (e) => setData({ ...data, [e.target.name]: e.target.value });
  const handleToggle = (name) => setData({ ...data, [name]: !data[name] });

  const generateDoc = (save = true) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const margin = 18; let y = 18;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('CLÁUSULA EN PROTECCIÓN DE DATOS DE CARÁCTER PERSONAL.', 105, y, { align: 'center' });
    y += 8; doc.setLineWidth(0.4); doc.line(margin, y, 192, y);
    y += 8; doc.setFontSize(9.5); doc.text('Información en protección de datos.', margin, y);
    y += 6; doc.setFont('helvetica', 'normal'); doc.setFontSize(8.2);
    
    // TEXTO ÍNTEGRO PDF (RESTORED v6.9)
    const p1 = `Conforme a la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales y al Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo de 27 de abril de 2016, los datos personales facilitados, serán tratados por LAURA PASCUAL JIMENEZ, con N.I.F 33522200E, con la finalidad de gestionar y prestar el servicio contratado con fines de facturación, realizar gestiones administrativas y/o contables, gestión de consultas, así como, cumplir con obligaciones legales impuestas, en su caso, para la formulación, el ejército o la defensa de reclamaciones, y siempre que nos autorice, con fines comerciales / promocionales sobre la actividad de la entidad.`;
    const p2 = `Podrá ejercitar los derechos de acceso, rectificación, supresión y demás derechos recogidos en la normativa mencionada, remitiendo una solicitud por escrito o a través de la siguiente dirección de correo electrónico laura.pscl@gmail.com adjuntando fotocopia de su D.N.I. o documento equivalente. En caso de que sienta vulnerados sus derechos in lo concerniente a la protección de sus datos personales, especialmente cuando no haya obtenido satisfacción en el ejercicio de sus derechos, puede presentar una reclamación ante la Autoridad de Control en materia de Protección de Datos competente (Agencia Española de Protección de Datos), a través de su sitio web: www.agpd.es.`;
    const p3 = `Mediante la firma del presente documento, el abajo firmante declara y garantiza que los datos aportados son verdaderos, exactos, completos y se encuentran actualizados; comprometiéndose a informar de cualquier cambio respecto de los mismos, siendo el único responsable de los daños o perjuicios, tanto directos como indirectos, que pudieran ocasionarse como consecuencia del incumplimiento de la presente cláusula. Puede solicitar información adicional acerca de cómo tratamos sus datos al correo electrónico laura.pscl@gmail.com`;

    const l1 = doc.splitTextToSize(p1, 175); doc.text(l1, margin, y); y += (l1.length * 4.2) + 2;
    const l2 = doc.splitTextToSize(p2, 175); doc.text(l2, margin, y); y += (l2.length * 4.2) + 2;
    const l3 = doc.splitTextToSize(p3, 175); doc.text(l3, margin, y); y += (l3.length * 4.2) + 5;

    doc.setFont('helvetica', 'bold'); doc.text('DATOS PERSONALES.-', margin, y); y += 5;
    doc.setFont('helvetica', 'normal'); doc.text(`NOMBRE y APELLIDOS: ${data.tutor}`, margin, y); y += 5;
    doc.text(`TELÉFONO: ${data.telf}        email: ${data.email_cliente}`, margin, y);

    y += 10; doc.setFont('helvetica', 'bold'); doc.text('AUTORIZACIONES.', margin, y); y += 5;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
    doc.text('Asimismo, en cumplimiento de la normativa citada, es necesario marcar con una cruz las casillas de verificación. En el caso de que marquen el NO, entenderemos que no nos autoriza a dicho tratamiento.', margin, y); y += 7;
    
    doc.text(`SI [${data.auth1?'X':' '}] NO [${!data.auth1?'X':' '}] — AUTORIZO a la entidad tratar los datos facilitados, según lo indicado. (Su negativa a facilitarnos la autorización implicará la imposibilidad de tratar sus datos con la finalidad indicada).`, margin + 4, y); y += 5.5;
    doc.text(`SI [${data.auth2?'X':' '}] NO [${!data.auth2?'X':' '}] — AUTORIZO el uso de los datos facilitados, con la finalidad de recibir información relativa a la actividad de la entidad. (Su negativa implicará la imposibilidad de enviarle información de servicios, ofertas, etc.).`, margin + 4, y); y += 5.5;
    doc.text(`SI [${data.auth3?'X':' '}] NO [${!data.auth3?'X':' '}] — AUTORIZO a la entidad enviarme comunicaciones vía Whatsapp con la finalidad de informar sobre citas, cambios de horarios o cualquier otra información relevante.`, margin + 4, y);

    y += 10;
    const mText = `Los menores de 14 años no pueden facilitarnos sus datos... deberá otorgar su consentimiento el padre, madre o tutor del menor o incapaz.`;
    doc.text(doc.splitTextToSize(mText, 175), margin, y);

    y = 230;
    doc.setFont('helvetica', 'bold'); doc.text('TUTOR / PADRE / MADRE', margin, y); doc.text('INTERESADO / MENOR / INCAPAZ', 115, y);
    y += 5; doc.setFont('helvetica', 'normal'); doc.text(data.tutor || '________________________', margin, y); doc.text(data.menor || '________________________', 115, y);
    if (sigPadTutor.current && !sigPadTutor.current.isEmpty()) doc.addImage(sigPadTutor.current.toDataURL(), 'PNG', margin, y + 4, 50, 20);
    if (sigPadMenor.current && !sigPadMenor.current.isEmpty()) doc.addImage(sigPadMenor.current.toDataURL(), 'PNG', 115, y + 4, 50, 20);
    y += 28; doc.line(margin, y, margin + 65, y); doc.line(115, y, 180, y);
    y += 15; doc.text(`En MADRID, a ${new Date().getDate()} de marzo de 2026`, 192, y, { align: 'right' });
    if(save) doc.save(`Firma_LOPD_${data.tutor.split(' ')[0] || 'Firmado'}.pdf`); return doc;
  };

  const handleDownload = () => { setIsGenerating(true); try { generateDoc(true); } finally { setIsGenerating(false); } };
  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const doc = generateDoc(false);
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `Lopd_Firma.pdf`, { type: 'application/pdf' });
      if (navigator.share) await navigator.share({ files: [file], title: 'Gabinete IA - Firma LOPD' });
    } catch (err) {} finally { setIsGenerating(false); }
  };

  return (
    <div className="wrap">
      <header className="header-branded">
        <div className="logo-box">
          <img src="/logo.png" alt="" className="header-logo" onError={(e)=>e.target.style.display='none'} />
        </div>
        <div className="header-text">
          <h1>Firma Digital LOPD</h1>
          <div className="sub-brand">psique_como</div>
          <div className="prof-tag">(<strong>{PROFESIONAL_DATA.nombre}</strong>)</div>
        </div>
      </header>

      {/* RESTAURANDO LECTURA COMPLETA */}
      <section className="card">
        <h2>LECTURA ÍNTEGRA DEL DOCUMENTO</h2>
        <h4 className="hdr-blue">Información en protección de datos.</h4>
        <div className="scroll-legal">
          <p>Conforme a la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales y al Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo de 27 de abril de 2016, los datos personales facilitados, serán tratados por <strong>{PROFESIONAL_DATA.nombre}</strong>, con N.I.F <strong>{PROFESIONAL_DATA.dni}</strong>, con la finalidad de gestionar y prestar el servicio contratado con fines de facturación, realizar gestiones administrativas y/o contables, gestión de consultas, así como, cumplir con obligaciones legales impuestas, en su caso, para la formulación, el ejército o la defensa de reclamaciones, y siempre que nos autorice, con fines comerciales / promocionales sobre la actividad de la entidad.</p>
          <p>Podrá ejercitar los derechos de acceso, rectificación, supresión y demás derechos recogidos en la normativa mencionada, remitiendo una solicitud por escrito o a través de la siguiente dirección de correo electrónico <strong>{PROFESIONAL_DATA.email}</strong> adjuntando fotocopia de su D.N.I. o documento equivalente. En caso de que sienta vulnerados sus derechos in lo concerniente a la protección de sus datos personales, especialmente cuando no haya obtenido satisfacción en el ejercicio de sus derechos, puede presentar una reclamación ante la Autoridad de Control en materia de Protección de Datos competente (Agencia Española de Protección de Datos), a través de su sitio web: www.agpd.es.</p>
          <p>Mediante la firma del presente documento, el abajo firmante declara y garantiza que los datos aportados son verdaderos, exactos, completos y se encuentran actualizados; comprometiéndose a informar de cualquier cambio respecto de los mismos, siendo el único responsable de los daños o perjuicios, tanto directos como indirectos, que pudieran ocasionarse como consecuencia del incumplimiento de la presente cláusula. Puede solicitar información adicional acerca de cómo tratamos sus datos al correo electrónico <strong>{PROFESIONAL_DATA.email}</strong>.</p>
        </div>
      </section>

      <section className="card">
        <h2>DATOS DEL CLIENTE / REPRESENTANTE</h2>
        <div className="form-stack">
           <div className="field-row"><div className="field"><label>Tutor / Padre / Madre</label><input name="tutor" value={data.tutor} onChange={handleInput} /></div><div className="field"><label>DNI Tutor</label><input name="dni_tutor" value={data.dni_tutor} onChange={handleInput} /></div></div>
           <div className="field-row"><div className="field"><label>Nombre Interesado / Menor</label><input name="menor" value={data.menor} onChange={handleInput} /></div><div className="field"><label>DNI del Menor</label><input name="dni_menor" value={data.dni_menor} onChange={handleInput} /></div></div>
           <div className="field-row"><div className="field"><label>Teléfono Movil</label><input name="telf" value={data.telf} onChange={handleInput} /></div><div className="field"><label>Email de contacto</label><input name="email_cliente" value={data.email_cliente} onChange={handleInput} /></div></div>
        </div>
      </section>

      <section className="card">
        <h2>AUTORIZACIONES (COMPLETAS)</h2>
        <div className="opts-list">
           <div className={`opt-box ${data.auth1?'on':''}`} onClick={()=>handleToggle('auth1')}>
             <div className="bullet">{data.auth1?'SÍ':'NO'}</div>
             <p>AUTORIZO a la entidad tratar los datos facilitados, según lo indicado. (Su negativa a facilitarnos la autorización implicará la imposibilidad de tratar sus datos con la finalidad indicada).</p>
           </div>
           <div className={`opt-box ${data.auth2?'on':''}`} onClick={()=>handleToggle('auth2')}>
             <div className="bullet">{data.auth2?'SÍ':'NO'}</div>
             <p>AUTORIZO el uso de los datos facilitados, con la finalidad de recibir información relativa a la actividad de la entidad. (Su negativa implicará la imposibilidad de enviarle información de servicios, ofertas, etc.).</p>
           </div>
           <div className={`opt-box ${data.auth3?'on':''}`} onClick={()=>handleToggle('auth3')}>
             <div className="bullet">{data.auth3?'SÍ':'NO'}</div>
             <p>AUTORIZO a la entidad enviarme comunicaciones vía Whatsapp con la finalidad de informar sobre citas, cambios de horarios o cualquier otra información relevante.</p>
           </div>
        </div>
      </section>

      <div className="signatures-grid">
        <section className="card pad-unit">
          <h2>Firma del Tutor</h2>
          <div className="draw-box"><SignatureCanvas ref={sigPadTutor} penColor="#1e3a8a" canvasProps={{className: 'canv'}}/></div>
          <button onClick={()=>sigPadTutor.current.clear()} className="cls-lnk">Limpiar firma</button>
        </section>
        <section className="card pad-unit">
          <h2>Firma del Menor</h2>
          <div className="draw-box"><SignatureCanvas ref={sigPadMenor} penColor="#1e3a8a" canvasProps={{className: 'canv'}}/></div>
          <button onClick={()=>sigPadMenor.current.clear()} className="cls-lnk">Limpiar firma</button>
        </section>
      </div>

      <section className="card final-cta">
        <div className="btn-group">
          <button onClick={handleDownload} className="btn-main" disabled={isGenerating}>{isGenerating ? 'ESPERE...' : 'DESCARGAR PDF 📄'}</button>
          <button onClick={handleShare} className="btn-wa" disabled={isGenerating}>WHATSAPP 📲</button>
        </div>
      </section>

      <div className="foot">&copy; 2026 psique_como — v7.2 ULTIMATE SYNC</div>

      <style>{`
        :root{
          --bg:#f7f8fb; --card:#ffffff; --text:#0f172a; --muted:#475569; --border:#e2e8f0; --shadow:0 10px 30px rgba(2,6,23,.08);
          --primary:#5C73F2; --secondary:#91BBF2; --ok:#22c55e; --sans: system-ui,-apple-system,Helvetica,Arial,sans-serif;
        }
        *{box-sizing:border-box}
        body{ margin:0; background:var(--bg); font-family:var(--sans); color:var(--text); }
        .wrap{ max-width:900px; margin:0 auto; padding:30px 15px 80px; }

        .header-branded {
          background: linear-gradient(90deg, var(--primary), var(--secondary)); color: #fff; border-radius: 20px; padding: 35px; box-shadow: var(--shadow);
          display: flex; align-items: center; gap: 25px; margin-bottom: 25px; position: relative; overflow: hidden;
        }
        .header-branded:after { content:""; position:absolute; inset:-40px -60px auto auto; width:180px; height:180px; border-radius:999px; background:rgba(255,255,255,.12); }
        .logo-box { width: 85px; height: 85px; background: #fff; border-radius: 999px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 3px solid rgba(255,255,255,0.3); flex-shrink: 0; }
        .header-logo { width: 100%; height: 100%; object-fit: contain; }
        .header-text h1 { margin: 0; font-size: 1.8rem; font-weight: 950; }
        .sub-brand { font-size: 1.4rem; font-weight: 950; color: #fff; line-height: 1; margin-top: 2px; }
        .prof-tag { font-size: 0.85rem; opacity: 0.85; margin-top: 2px; }

        .card{ background:var(--card); border:1px solid var(--border); border-radius:20px; padding:30px; margin-bottom:25px; box-shadow:var(--shadow); }
        h2{margin:0 0 15px; font-size:1.1rem; font-weight:900; color:var(--primary); text-transform:uppercase;}
        .hdr-blue{ color:var(--primary); margin-bottom:15px; font-weight:800; }
        .scroll-legal{ max-height:280px; overflow-y:auto; padding-right:15px; font-size:0.9rem; color:var(--muted); text-align:justify; line-height:1.7; }
        .field-row{ display:flex; gap:20px; margin-bottom:20px; }
        .field{ flex:1; display:flex; flex-direction:column; }
        .field label{ font-size:0.75rem; font-weight:800; color:var(--muted); margin-bottom:8px; text-transform:uppercase; }
        .field input{ padding:15px; border:2px solid #f1f5f9; border-radius:12px; font-size:1rem; color:var(--text); width:100% !important; }
        .opt-box{ display:flex; align-items:flex-start; gap:15px; padding:18px; background:#f8fafc; border-radius:15px; cursor:pointer; margin-bottom:10px;}
        .opt-box.on{ background:#eff6ff; border:1px solid var(--secondary); }
        .bullet{ width:45px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:#cbd5e1; border-radius:8px; font-weight:950; color:#fff; font-size:0.8rem; }
        .opt-box.on .bullet{ background:var(--ok); }
        .opt-box p{ margin:0; font-size:0.88rem; line-height:1.45; }
        .signatures-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px; }
        @media(max-width:700px){ .signatures-grid{ grid-template-columns:1fr; } .header-branded { flex-direction: column; text-align: center; } }
        .draw-box{ background:#fff; border:2px solid #f1f5f9; border-radius:15px; height:200px; overflow:hidden; margin-top:10px; }
        .canv{ width:100% !important; height:100% !important; }
        .cls-lnk{ background:none; border:none; color:#ef4444; font-size:0.75rem; font-weight:700; cursor:pointer; text-decoration:underline; margin-top:5px; }
        .btn-group{ display:grid; grid-template-columns: 1fr 1fr; gap:20px; }
        @media(max-width:600px){ .btn-group{ grid-template-columns:1fr; } }
        .btn-main, .btn-wa{ padding:22px; color:#fff; border:none; border-radius:18px; font-size:1.15rem; font-weight:950; cursor:pointer; width:100%; box-shadow:0 10px 20px rgba(0,0,0,0.1); }
        .btn-main{ background:var(--primary); }
        .btn-wa{ background:var(--ok); }
        .foot{ text-align:center; font-size:0.8rem; color:var(--muted); margin-top:30px; }
      `}</style>
    </div>
  );
}
