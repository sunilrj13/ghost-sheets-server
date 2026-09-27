import pool from '@/lib/db';
import { generateKey, revokeLicense, activateLicenseAgain, deleteLicense, revokeDevice, unrevokeDevice } from './actions';
import { Key, Monitor, PowerOff, Trash2, Zap, ShieldAlert, CheckCircle2, UserCircle, Calendar, PlusCircle } from 'lucide-react';
import { RowDataPacket } from 'mysql2';

interface ILicense extends RowDataPacket {
  id: string;
  key: string;
  status: string;
  maxDevices: number;
  expiresAt: string | null;
  createdAt: string;
  customerName: string;
}

interface IDevice extends RowDataPacket {
  id: string;
  licenseId: string;
  hardwareId: string;
  deviceName: string;
  lastActive: string;
  isRevoked: boolean;
}

export default async function AdminDashboard() {
  const [licenses] = await pool.query<ILicense[]>('SELECT * FROM License ORDER BY createdAt DESC');
  const [devices] = await pool.query<IDevice[]>('SELECT * FROM Device');

  // Map devices to their respective licenses
  const licensesWithDevices = licenses.map(license => ({
    ...license,
    devices: devices.filter(d => d.licenseId === license.id)
  }));


  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Header */}
      <header className="border-b border-white/5 bg-white/[0.02] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Ghost Sheets</h1>
              <p className="text-xs text-indigo-400 font-medium tracking-wider uppercase">License Manager</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10 relative">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Left Column: Generate Form */}
        <div className="lg:w-1/3">
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-xl sticky top-28 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-indigo-400" />
              Issue New Key
            </h2>
            <p className="text-gray-400 text-sm mb-8">Generate a new license key for a customer.</p>
            
            <form action={generateKey} className="flex flex-col gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Customer Name</label>
                <input 
                  type="text" 
                  name="customerName" 
                  required
                  placeholder="e.g. Sunil Joshi"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Max Devices</label>
                <input 
                  type="number" 
                  name="maxDevices" 
                  min="1" 
                  defaultValue="1"
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Expiry Date (Optional)</label>
                <input 
                  type="date" 
                  name="expiresAt" 
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                />
              </div>

              <button 
                type="submit"
                className="mt-4 w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] flex justify-center items-center gap-2"
              >
                <Key className="w-5 h-5" />
                Generate License Key
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: License List */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-white">Active Licenses</h2>
            <div className="text-sm font-medium text-indigo-400 bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              Total: {licensesWithDevices.length}
            </div>
          </div>

          {licensesWithDevices.length === 0 ? (
             <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                <Key className="w-12 h-12 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-300">No licenses yet</h3>
                <p className="text-gray-500 mt-2">Generate your first license key to get started.</p>
             </div>
          ) : (
            licensesWithDevices.map(license => (
              <div key={license.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 backdrop-blur-sm hover:bg-white/[0.04] transition-colors group">
                {/* License Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-lg font-bold text-white tracking-wide bg-black/40 px-3 py-1 rounded-lg border border-white/10 select-all">
                        {license.key}
                      </span>
                      {license.status === 'ACTIVE' ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                          <ShieldAlert className="w-3.5 h-3.5" /> {license.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-5 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <UserCircle className="w-4 h-4 text-gray-500" />
                        {license.customerName}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Lifetime'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-4 h-4 text-gray-500" />
                        {license.devices.filter(d => !d.isRevoked).length} / {license.maxDevices} Devices
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {license.status === 'ACTIVE' ? (
                      <form action={revokeLicense.bind(null, license.id)}>
                        <button className="p-2 text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors border border-transparent hover:border-rose-400/20" title="Revoke License">
                          <PowerOff className="w-5 h-5" />
                        </button>
                      </form>
                    ) : (
                      <form action={activateLicenseAgain.bind(null, license.id)}>
                        <button className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-xl transition-colors border border-transparent hover:border-emerald-400/20" title="Activate License">
                          <Zap className="w-5 h-5" />
                        </button>
                      </form>
                    )}
                    <form action={deleteLicense.bind(null, license.id)}>
                      <button className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors border border-transparent hover:border-red-400/20" title="Delete License">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Devices */}
                {license.devices.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">Linked Devices</h4>
                    {license.devices.map(device => (
                      <div key={device.id} className="flex items-center justify-between bg-black/30 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${device.isRevoked ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                            <Monitor className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-300">{device.deviceName}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{device.hardwareId} • Last active: {new Date(device.lastActive).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div>
                          {device.isRevoked ? (
                             <form action={unrevokeDevice.bind(null, device.id)}>
                               <button className="text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-3 py-1.5 rounded-lg transition-colors border border-emerald-400/20">
                                 Unblock
                               </button>
                             </form>
                          ) : (
                             <form action={revokeDevice.bind(null, device.id)}>
                               <button className="text-xs font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 px-3 py-1.5 rounded-lg transition-colors border border-rose-400/20">
                                 Block Device
                               </button>
                             </form>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
