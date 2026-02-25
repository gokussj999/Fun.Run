    if (screen === "SEARCH") {
      content = (
        <ScreenShell>
          <Title sub={null}>Search</Title>

          <Input
            label="Search for a coin"
            value={searchQ}
            onChange={setSearchQ}
            placeholder="type name or symbol…"
            rightIcon={<span style={{ fontWeight: 950 }}>⌕</span>}
          />

          <Card>
            <SectionHeader
              title={searchQ.trim() ? `Results (${searchResults.length})` : "Top volume"}
              right={<Pill tone="good">Live</Pill>}
            />
            <div className="miniScroll" style={{ maxHeight: 420, paddingRight: 6, display: "grid", gap: 10 }}>
              {(searchQ.trim() ? searchResults : topVolume.slice(0, 20)).map((c) => (
                <CoinRow
                  key={c.id}
                  c={c}
                  onClick={() => {
                    setSelectedCoinId(c.id);
                    setScreen("COIN");
                  }}
                />
              ))}
              {searchQ.trim() && searchResults.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>No results</div>
              ) : null}
            </div>
          </Card>
        </ScreenShell>
      );
    }

    if (screen === "LATEST") {
      content = (
        <ScreenShell>
          <Title
            sub={null}
            right={
              <MiniBtn onClick={loadCoins} disabled={loadingCoins}>
                {loadingCoins ? "…" : "Refresh"}
              </MiniBtn>
            }
          >
            Latest
          </Title>

          <Card>
            <SectionHeader title="Top movers" right={<Pill tone="good">Live</Pill>} />
            <div className="hScroll" style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
              {movers.slice(0, 10).map((c, i) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle="Top mover"
                  tag={`#${i + 1}`}
                  accent={i % 2 === 0 ? "var(--primary)" : "var(--accent2)"}
                  onOpen={() => {
                    setSelectedCoinId(c.id);
                    setScreen("COIN");
                  }}
                />
              ))}
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Moon shooter" right={<Pill tone="warn">+15% 🚀</Pill>} />
            <div className="hScroll" style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
              {moonshots.slice(0, 10).map((c) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle="Moon"
                  tag="MOON"
                  accent="var(--warn)"
                  onOpen={() => {
                    setSelectedCoinId(c.id);
                    setScreen("COIN");
                  }}
                />
              ))}
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Top volume" right={<Pill tone="warn">SOL</Pill>} />
            <div className="hScroll" style={{ display: "flex", gap: 10, paddingBottom: 4 }}>
              {topVolume.slice(0, 10).map((c) => (
                <CoinMiniCard
                  key={c.id}
                  c={c}
                  subtitle={`Volume • ${Number(c.volumeSol || 0).toFixed(2)} SOL`}
                  tag="VOL"
                  accent="var(--primary)"
                  onOpen={() => {
                    setSelectedCoinId(c.id);
                    setScreen("COIN");
                  }}
                />
              ))}
            </div>
          </Card>
        </ScreenShell>
      );
    }

    if (screen === "COIN") {
      if (!selectedCoin) {
        content = (
          <ScreenShell>
            <Title sub="Pick from Home">No coin selected</Title>
            <GhostButton onClick={() => setScreen("HOME")}>Go Home</GhostButton>
          </ScreenShell>
        );
      } else {
        const c = selectedCoin;
        const isLiveNow = c.status === "LIVE";
        const txMarkers = myTxList.filter((t) => t.coinId === c.id).slice(0, 20);
        const myHoldingForCoin = myHoldingsList.find((h) => h.coinId === c.id)?.amount || 0;

        const totalSupply = Number(c.totalSupply || 0);
        const myPct = totalSupply > 0 ? (Number(myHoldingForCoin || 0) / totalSupply) * 100 : 0;

        content = (
          <ScreenShell fullBleed>
            <Title
              sub={<span style={{ color: "var(--muted2)" }}>Coin: <b style={{ color: "var(--text)" }}>{shortWallet(c.id)}</b></span>}
              right={
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <MiniBtn onClick={() => setScreen("HOME")}>Back</MiniBtn>
                  <MiniBtn onClick={() => copyText(c.id)} tone="warn">Copy ID</MiniBtn>
                </div>
              }
            >
              <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
                <CoinLogo c={c} size={30} />
                <span style={{ fontWeight: 950 }}>{c.symbol || "—"}</span>
              </span>
            </Title>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <Pill>Status: {c.status}</Pill>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Pill>MC: {fmtUsd(c.mc || 0)}</Pill>
                <Pill>ATH: {fmtUsd(c.ath || 0)}</Pill>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              <Pill>Supply: {Number(totalSupply || 0).toFixed(0)}</Pill>
              <Pill tone="warn">Your: {Number(myHoldingForCoin || 0).toFixed(0)}</Pill>
              <Pill tone={myPct >= 20 ? "danger" : "good"}>Share: {myPct.toFixed(2)}%</Pill>
            </div>

            <PriceChart
              points={c.chart}
              txMarkers={txMarkers}
              mode={chartMode}
              onToggleMode={() => setChartMode((m) => (m === "dark" ? "light" : "dark"))}
            />

            <div style={{ height: 12 }} />

            <Card>
              <div style={{ fontWeight: 950, marginBottom: 8 }}>Trade</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <MiniBtn
                  onClick={() => {
                    setTradeSide("BUY");
                    setTradeSol("0.05");
                    setTradeOpen(true);
                  }}
                  tone="good"
                >
                  Buy
                </MiniBtn>
                <MiniBtn
                  disabled={!isLiveNow}
                  onClick={() => {
                    setTradeSide("SELL");
                    setTradeSol("0.05");
                    setTradeOpen(true);
                  }}
                  tone="danger"
                >
                  Sell
                </MiniBtn>
                <Pill>On-chain SOL: {balance} SOL</Pill>
                <Pill>Your tokens: {Number(myHoldingForCoin).toFixed(0)}</Pill>
              </div>
            </Card>

            <Modal
              open={tradeOpen}
              title={`${tradeSide === "BUY" ? "Buy" : "Sell"} ${c.symbol || ""}`}
              onClose={() => (tradeLoading ? null : setTradeOpen(false))}
              onConfirm={async () => {
                if (tradeLoading) return;
                await doTrade(c, tradeSide, tradeSol);
                setTradeOpen(false);
              }}
              confirmText={tradeLoading ? "..." : tradeSide === "BUY" ? "Confirm Buy" : "Confirm Sell"}
              confirmTone={tradeSide === "BUY" ? "primary" : "danger"}
            >
              <Input
                label="Amount (SOL)"
                value={tradeSol}
                onChange={setTradeSol}
                placeholder="e.g. 0.05"
                type="number"
              />
            </Modal>

            <div style={{ height: 10 }} />
            <GhostButton onClick={() => setScreen("HOME")}>Back</GhostButton>
          </ScreenShell>
        );
      }
    }

    if (screen === "CREATE") {
      content = (
        <ScreenShell>
          <Title sub={null}>Create Coin</Title>

          <Input
            label="Coin name"
            hint="2–32"
            value={tokenName}
            onChange={setTokenName}
            placeholder=""
            maxLength={32}
            error={nameErr}
          />
          <Input
            label="Symbol"
            hint="A-Z/0-9"
            value={symbolUpper}
            onChange={setSymbol}
            placeholder=""
            maxLength={10}
            error={symErr}
          />
          <Input
            label="Initial SOL"
            hint="0 or 0.01+"
            value={initialSol}
            onChange={setInitialSol}
            placeholder="0 or 0.01+"
            type="number"
            error={solErr}
          />

          <Card>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,.18)",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>Logo</span>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>Logo (≤ 5MB)</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => onPickLogo(e.target.files?.[0])}
                  style={{ width: "100%", color: "var(--muted)" }}
                />
                <div style={{ marginTop: 6, color: logoError ? "var(--danger)" : "var(--muted)", fontSize: 12 }}>
                  {logoError ? logoError : logoPreview ? "Selected ✅" : "Required"}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ height: 12 }} />
          <Textarea
            label="Your coin story"
            value={story}
            onChange={setStory}
            placeholder="20+ chars story..."
            maxLength={300}
            error={storyErr}
          />

          <PrimaryButton disabled={!canCreate} onClick={() => setConfirmOpen(true)}>
            Review & Create
          </PrimaryButton>

          <div style={{ height: 10 }} />
          <GhostButton onClick={() => setScreen("HOME")}>Back</GhostButton>

          <Modal
            open={confirmOpen}
            title="Confirm coin"
            onClose={() => setConfirmOpen(false)}
            onConfirm={async () => {
              setConfirmOpen(false);
              if (!solAddr) return showToast("Wallet not ready");

              const payload = {
                name: tokenName.trim(),
                symbol: symbolUpper.trim(),
                story: story.trim(),
                logo: logoPreview,
                initialSol: Number(initialSol || 0),
                creatorWallet: solAddr,
              };

              const res = await apiPost("/api/coin/create", payload);
              if (!res?.ok) return showToast(res?.error || "Create failed");

              const created = ensureCoinShape(res.coin);
              setCoins((p) => [created, ...p]);

              setTokenName("");
              setSymbol("");
              setStory("");
              setInitialSol("0.01");
              setLogoPreview("");
              setLogoError("");

              setSelectedCoinId(created.id);
              setScreen("COIN");
              showToast("Coin created ✅");
              loadProfile();
            }}
            confirmText="Create"
          >
            <Card>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 54, height: 54, borderRadius: 20, border: "1px solid var(--border)", overflow: "hidden", background: "rgba(0,0,0,.18)" }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 950 }}>{tokenName || "—"}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{symbolUpper || "—"}</div>
                </div>
                <Pill>{Number(initialSol) >= 0.01 ? "LIVE" : "DRAFT"}</Pill>
              </div>
            </Card>
          </Modal>
        </ScreenShell>
      );
    }

    if (screen === "PROFILE") {
      const holdingsEnriched = myHoldingsList
        .map((h) => {
          const coin = coinsSorted.find((c) => c.id === h.coinId);
          const supply = Number(coin?.totalSupply || 0);
          const amt = Number(h.amount || 0);
          const pct = supply > 0 ? (amt / supply) * 100 : 0;
          return { ...h, coin, supply, amt, pct };
        })
        .filter((x) => x.amt > 0.0000001);

      const txEnriched = myTxList.slice(0, 40).map((t) => {
        const coin = coinsSorted.find((c) => c.id === t.coinId);
        return { ...t, coin };
      });

      content = (
        <ScreenShell allowYScroll={true}>
          <Title sub={null} right={<MiniBtn onClick={() => setScreen("SETTINGS")}>⚙ Settings</MiniBtn>}>
            Profile
          </Title>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Address</div>
                <div style={{ fontWeight: 950 }}>{shortWallet(solAddr)}</div>
              </div>
              <MiniBtn disabled={!solAddr} onClick={() => solAddr && copyText(solAddr)}>
                Copy
              </MiniBtn>
            </div>

            <div style={{ height: 10 }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Balance</div>
                <div style={{ fontWeight: 950 }}>{balance} SOL</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <MiniBtn tone="good" disabled={!solAddr} onClick={openDeposit}>Deposit</MiniBtn>
                <MiniBtn tone="warn" disabled={!solAddr} onClick={openWithdraw}>Withdraw</MiniBtn>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div style={{ padding: 12, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,.03)" }}>
              <div style={{ fontWeight: 950, marginBottom: 10 }}>Networks</div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <NetLogo chain="solana" />
                    <div style={{ fontWeight: 900 }}>Solana</div>
                  </div>
                  <Pill tone="good">Active</Pill>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, opacity: 0.9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <NetLogo chain="bnb" />
                    <div style={{ fontWeight: 900 }}>BNB</div>
                  </div>
                  <Pill>Coming soon</Pill>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, opacity: 0.9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <NetLogo chain="polygon" />
                    <div style={{ fontWeight: 900 }}>Polygon</div>
                  </div>
                  <Pill>Coming soon</Pill>
                </div>
              </div>
            </div>

            <div style={{ height: 12 }} />

            <div style={{ padding: 12, borderRadius: 16, border: "1px solid var(--border)", background: "rgba(255,255,255,.03)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 950 }}>Referral</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                    {myReferralLink ? `${myReferralLink.slice(0, 24)}…` : "Wallet loading…"}
                  </div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Pill tone="warn">Referral commission: 20%</Pill>
                    {refStatus ? (
                      <Pill>
                        {refStatus === "set"
                          ? "Referral applied ✅"
                          : refStatus === "already"
                          ? "Referral locked"
                          : "Referral invalid"}
                      </Pill>
                    ) : null}
                  </div>
                </div>
                <MiniBtn disabled={!myReferralLink} onClick={() => myReferralLink && copyText(myReferralLink)}>
                  Copy
                </MiniBtn>
              </div>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Referral Reward" right={<Pill tone="warn">20%</Pill>} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>{Number(myReferralRewardsSol || 0).toFixed(6)} SOL</div>
              <MiniBtn
                tone="good"
                disabled={oneClickW !== "" || Number(myReferralRewardsSol || 0) <= 0}
                onClick={() => oneClickWithdraw("REF")}
              >
                {oneClickW === "REF" ? "Withdrawing…" : "Withdraw"}
              </MiniBtn>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Creator Reward" right={<Pill>Coins: {Object.keys(myRewards.byCoin || {}).length}</Pill>} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 950 }}>{Number(myRewards.totalSol || 0).toFixed(6)} SOL</div>
              <MiniBtn
                tone="good"
                disabled={oneClickW !== "" || Number(myRewards.totalSol || 0) <= 0}
                onClick={() => oneClickWithdraw("CREATOR")}
              >
                {oneClickW === "CREATOR" ? "Withdrawing…" : "Withdraw"}
              </MiniBtn>
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="My Creations" right={<Pill>{myCreations.length}</Pill>} />
            <div className="hScroll" style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
              {myCreations.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>No coins yet.</div>
              ) : (
                myCreations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCoinId(c.id);
                      setScreen("COIN");
                    }}
                    style={{
                      minWidth: 240,
                      width: 240,
                      padding: 12,
                      borderRadius: 18,
                      border: "1px solid var(--border)",
                      background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                      color: "var(--text)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <CoinLogo c={c} size={44} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 950 }}>{c.symbol || "—"}</div>
                        <div style={{ marginTop: 4, color: "var(--muted)", fontSize: 12 }}>
                          {fmtUsd(c.mc || 0)} • {Number(c.volumeSol || 0).toFixed(2)} SOL
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="My Holdings" right={<Pill>{holdingsEnriched.length}</Pill>} />
            <div className="miniScroll" style={{ maxHeight: 320, paddingRight: 6, display: "grid", gap: 10 }}>
              {holdingsEnriched.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>No holdings yet.</div>
              ) : (
                holdingsEnriched.map((h) => (
                  <div
                    key={h.coinId}
                    style={{
                      padding: 12,
                      borderRadius: 18,
                      border: "1px solid var(--border)",
                      background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <CoinLogo c={h.coin || { symbol: "?" }} size={38} />
                      <div>
                        <div style={{ fontWeight: 950, lineHeight: 1.1 }}>{h.coin?.symbol || "—"}</div>
                        <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                          Last: {h.lastAt ? fmtTime(h.lastAt) : "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 950 }}>{Number(h.amt || 0).toFixed(2)}</div>
                      <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                        {h.supply > 0 ? `${h.pct.toFixed(2)}% of supply` : "supply —"}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <MiniBtn
                          onClick={() => {
                            setSelectedCoinId(h.coinId);
                            setScreen("COIN");
                          }}
                          tone="warn"
                          style={{ padding: "8px 10px", borderRadius: 12 }}
                        >
                          Open
                        </MiniBtn>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <SectionHeader title="Last Transactions" right={<Pill>{txEnriched.length}</Pill>} />
            <div className="miniScroll" style={{ maxHeight: 320, paddingRight: 6, display: "grid", gap: 10 }}>
              {txEnriched.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>No transactions yet.</div>
              ) : (
                txEnriched.map((t) => {
                  const side = String(t.side || "").toUpperCase();
                  const coin = t.coin || { symbol: "?" };
                  return (
                    <div
                      key={t.id || `${t.coinId}-${t.t}`}
                      style={{
                        padding: 12,
                        borderRadius: 18,
                        border: "1px solid var(--border)",
                        background: "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.14)), var(--card2)",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <CoinLogo c={coin} size={38} />
                        <div>
                          <div style={{ fontWeight: 950 }}>{coin.symbol || "TX"}</div>
                          <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                            {t.t ? fmtTime(t.t) : "—"}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <Pill tone={side === "SELL" ? "danger" : side === "BUY" ? "good" : "warn"}>
                          {side || "TX"}
                        </Pill>
                        <div style={{ marginTop: 8, fontWeight: 950 }}>
                          {Number(t.sol || 0).toFixed(4)} SOL
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <div style={{ height: 12 }} />
          <GhostButton onClick={logout}>Logout</GhostButton>
        </ScreenShell>
      );
    }

    if (screen === "SETTINGS") {
      content = (
        <ScreenShell>
          <Title sub={null} right={<MiniBtn onClick={() => setScreen("PROFILE")}>Back</MiniBtn>}>
            Settings
          </Title>

          <Card>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Theme</div>
            <div style={{ display: "grid", gap: 10 }}>
              <ThemeOption theme="neon" current={theme} setTheme={setTheme} label="Neon" />
              <ThemeOption theme="ocean" current={theme} setTheme={setTheme} label="Ocean" />
              <ThemeOption theme="rose" current={theme} setTheme={setTheme} label="Rose" />
              <ThemeOption theme="royal" current={theme} setTheme={setTheme} label="Royal" />
              <ThemeOption theme="lightgreen" current={theme} setTheme={setTheme} label="Light Green" />
            </div>
          </Card>

          <div style={{ height: 12 }} />

          <Card>
            <div style={{ fontWeight: 950, marginBottom: 8 }}>Wallet Backup</div>
            <div style={{ color: "var(--warn)", fontSize: 12, lineHeight: 1.5 }}>
              ⚠️ Warning: Apni private key / recovery phrase kisi ko mat dena. Backup sirf apne paas safe rakho.
            </div>
            <div style={{ height: 10 }} />
            <MiniBtn onClick={openPrivyBackup}>Open Backup</MiniBtn>
          </Card>

          <div style={{ height: 12 }} />
          <GhostButton onClick={logout}>Logout</GhostButton>
        </ScreenShell>
      );
    }
  }

  return (
    <>
      <ThemeStyles />
      {content}
      {ready && authenticated ? <BottomNav screen={screen} setScreen={setScreen} /> : null}
      <Toast msg={toast} />

      <Modal
        open={dwOpen}
        title={dwMode === "DEPOSIT" ? "Solana Deposit Address" : "Solana Withdraw"}
        onClose={() => setDwOpen(false)}
        onConfirm={async () => {
          if (dwMode === "DEPOSIT") {
            if (!solAddr) return;
            await copyText(solAddr);
            return;
          }
          const to = String(withdrawTo || "").trim();
          if (to.length < 20) return showToast("Paste valid address");

          const res = await apiPostTry(
            ["/api/withdraw", "/api/withdraw/manual", "/api/transfer", "/api/payout"],
            { wallet: solAddr, to, kind: "MANUAL" }
          );

          if (res?.ok) {
            showToast("Withdraw confirmed ✅");
            setDwOpen(false);
            await loadProfile();
            await refreshBalance();
          } else {
            showToast(res?.error || "Withdraw failed");
          }
        }}
        confirmText={dwMode === "DEPOSIT" ? "Copy address" : "Confirm"}
      >
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Network</div>
              <div style={{ fontWeight: 950, display: "flex", gap: 10, alignItems: "center" }}>
                <NetLogo chain="solana" /> Solana
              </div>
            </div>
            <Pill tone="good">{dwMode === "DEPOSIT" ? "Deposit" : "Withdraw"}</Pill>
          </div>

          <div style={{ height: 12 }} />

          {dwMode === "DEPOSIT" ? (
            <>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Address</div>
              <div
                style={{
                  marginTop: 6,
                  padding: 12,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                  background: "rgba(0,0,0,.18)",
                  fontSize: 12,
                  wordBreak: "break-all",
                }}
              >
                {solAddr || "—"}
              </div>

              <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
                Is address par SOL send karo. (Auto-copy ho chuka hai.)
              </div>
            </>
          ) : (
            <>
              <Input
                label="Withdraw to (destination address)"
                value={withdrawTo}
                onChange={setWithdrawTo}
                placeholder="Paste Solana address…"
              />
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, lineHeight: 1.5 }}>
                Manual withdraw: destination paste karo. (On-chain later)
              </div>
            </>
          )}
        </Card>
      </Modal>
    </>
  );
}